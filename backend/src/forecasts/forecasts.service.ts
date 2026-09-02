import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { addDays, addMonths, subMonths, format } from 'date-fns';

@Injectable()
export class ForecastsService {
  constructor(private prisma: PrismaService) {}

  async personalForecast(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return null;

    const now = new Date();
    const currentBalance = Number(wallet.balance);
    const historyWindowMonths = 3;
    const { avgMonthlySpend, avgMonthlyIncome, burnRate } =
      await this.getSpendingStats(wallet.id, historyWindowMonths);

    const [activeSubscriptions, futureBills] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId, ownerType: 'user', status: 'active' },
        orderBy: { nextDueDate: 'asc' },
      }),
      this.prisma.bill.findMany({
        where: {
          userId,
          ownerType: 'user',
          isPaid: false,
          dueDate: { gte: now, lte: addMonths(now, 3) },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const monthlySubscriptionCost = activeSubscriptions.reduce((sum, s) => {
      const amount = Number(s.amount);
      const normalized = s.billingCycle === 'annually'
        ? amount / 12
        : s.billingCycle === 'quarterly'
          ? amount / 3
          : amount;
      return sum + normalized;
    }, 0);

    const obligationCutoff = addDays(now, 30);
    const upcomingBillCost = futureBills
      .filter((b) => b.dueDate <= obligationCutoff)
      .reduce((sum, b) => sum + Number(b.amount), 0);
    const upcomingSubscriptionCost = activeSubscriptions
      .filter((s) => s.nextDueDate <= obligationCutoff)
      .reduce((sum, s) => sum + Number(s.amount), 0);
    const upcomingObligations = upcomingBillCost + upcomingSubscriptionCost;

    // Cash runway is intentionally independent of the user's plan assumption.
    // Reserve obligations that are already known to be due, then compare the
    // remaining recorded wallet balance with historical ledger spending.
    const runwayBalance = Math.max(0, currentBalance - upcomingObligations);
    const daysUntilZero = burnRate > 0
      ? Math.floor(runwayBalance / (burnRate / 30))
      : runwayBalance > 0
        ? 999
        : 0;

    // Project balance over the next 3 months. Known bills are applied in the
    // month they are due; recurring subscriptions are normalized monthly.
    const projections = [];
    let projectedBalance = currentBalance;
    for (let i = 1; i <= 3; i++) {
      const month = addMonths(now, i);
      const billsForMonth = futureBills
        .filter((b) =>
          b.dueDate.getFullYear() === month.getFullYear() &&
          b.dueDate.getMonth() === month.getMonth(),
        )
        .reduce((sum, b) => sum + Number(b.amount), 0);
      const projectedSpend = avgMonthlySpend + monthlySubscriptionCost + billsForMonth;
      projectedBalance = projectedBalance + avgMonthlyIncome - projectedSpend;
      projections.push({
        month: format(month, 'MMMM yyyy'),
        projectedBalance: Math.max(0, projectedBalance),
        projectedSpend,
        projectedIncome: avgMonthlyIncome,
      });
    }

    return {
      currentBalance,
      burnRate,
      avgMonthlySpend,
      avgMonthlyIncome,
      monthlySubscriptionCost,
      upcomingObligations,
      runwayBalance,
      historyWindowMonths,
      daysUntilZero,
      projections,
      recurringExpenses: [
        ...activeSubscriptions.map((s) => ({
          name: s.name,
          amount: Number(s.amount),
          nextDue: s.nextDueDate,
        })),
        ...futureBills.filter((b) => b.recurring).map((b) => ({
          name: b.name,
          amount: Number(b.amount),
          nextDue: b.dueDate,
        })),
      ],
    };
  }

  async householdForecast(householdId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { householdId } });
    if (!wallet) return null;

    const currentBalance = Number(wallet.balance);
    const { avgMonthlySpend, avgMonthlyIncome, burnRate } =
      await this.getSpendingStats(wallet.id, 3);

    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { id: true, name: true } } },
    });

    const memberForecasts = await Promise.all(
      members.map(async (member) => {
        const spent = await this.prisma.ledgerEntry.aggregate({
          where: {
            walletId: wallet.id,
            userId: member.userId,
            type: 'debit',
            createdAt: { gte: subMonths(new Date(), 3) },
          },
          _sum: { amount: true },
        });
        const avgMonthly = Number(spent._sum.amount || 0) / 3;
        return {
          userId: member.userId,
          name: member.user.name,
          avgMonthlySpend: avgMonthly,
        };
      }),
    );

    const projections = [];
    let projectedBalance = currentBalance;
    for (let i = 1; i <= 3; i++) {
      const month = addMonths(new Date(), i);
      projectedBalance = projectedBalance + avgMonthlyIncome - avgMonthlySpend;
      projections.push({
        month: format(month, 'MMMM yyyy'),
        projectedBalance: Math.max(0, projectedBalance),
        projectedSpend: avgMonthlySpend,
        projectedIncome: avgMonthlyIncome,
      });
    }

    return {
      householdId,
      currentBalance,
      burnRate,
      avgMonthlySpend,
      avgMonthlyIncome,
      projections,
      memberForecasts,
    };
  }

  private async getSpendingStats(walletId: string, months: number) {
    const since = subMonths(new Date(), months);

    const [totalSpent, totalEarned] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { walletId, type: 'debit', createdAt: { gte: since } },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { walletId, type: 'credit', createdAt: { gte: since } },
        _sum: { amount: true },
      }),
    ]);

    const avgMonthlySpend = Number(totalSpent._sum.amount || 0) / months;
    const avgMonthlyIncome = Number(totalEarned._sum.amount || 0) / months;
    const burnRate = avgMonthlySpend;

    return { avgMonthlySpend, avgMonthlyIncome, burnRate };
  }
}
