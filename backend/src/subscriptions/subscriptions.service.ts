import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { addDays, addMonths, addWeeks, addYears, addQuarters } from 'date-fns';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: {
        ownerType: (dto.ownerType as any) || 'user',
        userId: dto.ownerType === 'household' ? null : userId,
        householdId: dto.ownerType === 'household' ? dto.householdId : null,
        name: dto.name,
        category: (dto.category as any) || 'subscriptions',
        amount: dto.amount,
        billingCycle: (dto.billingCycle as any) || 'monthly',
        nextDueDate: new Date(dto.nextDueDate),
        autoRenew: dto.autoRenew ?? true,
        logo: dto.logo,
      },
    });
  }

  async findAll(userId: string) {
    // Get personal + household subscriptions
    const householdIds = await this.prisma.householdMember
      .findMany({ where: { userId }, select: { householdId: true } })
      .then((m) => m.map((x) => x.householdId));

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        OR: [
          { userId, ownerType: 'user' },
          { householdId: { in: householdIds }, ownerType: 'household' },
        ],
      },
      orderBy: { nextDueDate: 'asc' },
    });

    const now = new Date();
    const upcoming = subscriptions.filter(
      (s) => s.status === 'active' && s.nextDueDate > now,
    );
    const overdue = subscriptions.filter(
      (s) => s.status === 'active' && s.nextDueDate <= now,
    );

    return {
      all: subscriptions,
      upcoming,
      overdue,
      summary: {
        total: subscriptions.filter((s) => s.status === 'active').length,
        monthlyTotal: this.calculateMonthlyTotal(subscriptions.filter((s) => s.status === 'active')),
        upcomingCount: upcoming.length,
      },
    };
  }

  async findById(id: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...(dto.amount && { amount: dto.amount }),
        ...(dto.nextDueDate && { nextDueDate: new Date(dto.nextDueDate) }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.autoRenew !== undefined && { autoRenew: dto.autoRenew }),
      },
    });
  }

  async cancel(id: string) {
    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async getUpcomingDue(userId: string, days = 30) {
    const householdIds = await this.prisma.householdMember
      .findMany({ where: { userId }, select: { householdId: true } })
      .then((m) => m.map((x) => x.householdId));

    const cutoff = addDays(new Date(), days);

    return this.prisma.subscription.findMany({
      where: {
        OR: [
          { userId, ownerType: 'user' },
          { householdId: { in: householdIds }, ownerType: 'household' },
        ],
        status: 'active',
        nextDueDate: { lte: cutoff },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  private calculateMonthlyTotal(subscriptions: any[]): number {
    return subscriptions.reduce((total, sub) => {
      const amount = Number(sub.amount);
      switch (sub.billingCycle) {
        case 'daily': return total + amount * 30;
        case 'weekly': return total + amount * 4.33;
        case 'monthly': return total + amount;
        case 'quarterly': return total + amount / 3;
        case 'annually': return total + amount / 12;
        default: return total + amount;
      }
    }, 0);
  }
}
