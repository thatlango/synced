import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBillDto } from './dto/bill.dto';
import { addDays } from 'date-fns';

@Injectable()
export class BillsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBillDto) {
    return this.prisma.bill.create({
      data: {
        ownerType: (dto.ownerType as any) || 'user',
        userId: dto.ownerType === 'household' ? null : userId,
        householdId: dto.ownerType === 'household' ? dto.householdId : null,
        name: dto.name,
        category: (dto.category as any) || 'utilities',
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        recurring: dto.recurring ?? false,
        billingCycle: dto.billingCycle as any,
        provider: dto.provider,
        accountRef: dto.accountRef,
      },
    });
  }

  async findAll(userId: string, includePaid = false) {
    const householdIds = await this.prisma.householdMember
      .findMany({ where: { userId }, select: { householdId: true } })
      .then((m) => m.map((x) => x.householdId));

    const where: any = {
      OR: [
        { userId, ownerType: 'user' },
        { householdId: { in: householdIds }, ownerType: 'household' },
      ],
    };
    if (!includePaid) where.isPaid = false;

    return this.prisma.bill.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  }

  async getUpcomingBills(userId: string, days = 30) {
    const householdIds = await this.prisma.householdMember
      .findMany({ where: { userId }, select: { householdId: true } })
      .then((m) => m.map((x) => x.householdId));

    const cutoff = addDays(new Date(), days);

    const bills = await this.prisma.bill.findMany({
      where: {
        OR: [
          { userId, ownerType: 'user' },
          { householdId: { in: householdIds }, ownerType: 'household' },
        ],
        isPaid: false,
        dueDate: { lte: cutoff },
      },
      orderBy: { dueDate: 'asc' },
    });

    const subscriptions = await this.prisma.subscription.findMany({
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

    const totalBills = bills.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalSubscriptions = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0);

    return {
      bills,
      subscriptions,
      summary: {
        totalUpcoming: totalBills + totalSubscriptions,
        billsTotal: totalBills,
        subscriptionsTotal: totalSubscriptions,
        count: bills.length + subscriptions.length,
        nextDue: bills[0]?.dueDate || subscriptions[0]?.nextDueDate || null,
      },
    };
  }

  async markPaid(id: string) {
    return this.prisma.bill.update({
      where: { id },
      data: { isPaid: true, paidAt: new Date() },
    });
  }

  async findById(id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }
}
