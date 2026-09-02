import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBillDto } from './dto/bill.dto';
import { RecurringDetectionService } from './recurring-detection.service';
import { addDays, addMonths, addQuarters, addWeeks, addYears } from 'date-fns';

@Injectable()
export class BillsService {
  constructor(
    private prisma: PrismaService,
    private recurringDetection: RecurringDetectionService,
  ) {}

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
    const detection = await this.recurringDetection.detect(userId, true);
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
      detectedPatterns: detection.patterns,
      recurringDetection: {
        autoCreated: detection.autoCreated,
        candidates: detection.patterns.length,
      },
      summary: {
        totalUpcoming: totalBills + totalSubscriptions,
        billsTotal: totalBills,
        subscriptionsTotal: totalSubscriptions,
        count: bills.length + subscriptions.length,
        nextDue: bills[0]?.dueDate || subscriptions[0]?.nextDueDate || null,
      },
    };
  }

  async detectRecurring(userId: string, autoCreate = true) {
    return this.recurringDetection.detect(userId, autoCreate);
  }

  async markPaid(id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');

    return this.prisma.$transaction(async (tx) => {
      const paid = await tx.bill.update({
        where: { id },
        data: { isPaid: true, paidAt: new Date() },
      });

      if (bill.recurring && bill.billingCycle) {
        await tx.bill.create({
          data: {
            ownerType: bill.ownerType,
            userId: bill.userId,
            householdId: bill.householdId,
            name: bill.name,
            category: bill.category,
            amount: bill.amount,
            currency: bill.currency,
            dueDate: nextCycleDate(bill.dueDate, bill.billingCycle as string),
            recurring: true,
            billingCycle: bill.billingCycle,
            provider: bill.provider,
            accountRef: bill.accountRef,
          },
        });
      }

      return paid;
    });
  }

  async findById(id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }
}

function nextCycleDate(date: Date, cycle: string): Date {
  switch (cycle) {
    case 'daily': return addDays(date, 1);
    case 'weekly': return addWeeks(date, 1);
    case 'quarterly': return addQuarters(date, 1);
    case 'annually': return addYears(date, 1);
    default: return addMonths(date, 1);
  }
}
