import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { addDays, addMonths, subMonths, format } from 'date-fns';

@Injectable()
export class ForecastsService {
  constructor(private prisma: PrismaService) {}

  async personalForecast(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return null;

    const currentBalance = Number(wallet.balance);
    const { avgMonthlySpend, avgMonthlyIncome, burnRate } =
      await this.getSpendingStats(wallet.id, 3);

    const upcomingSubscriptions = await this.prisma.subscription.findMany({
      where: { userId, status: 'active' },
      orderBy: { nextDueDate: 'asc' },
    });

    const monthlySubscriptionCost = upcomingSubscriptions.reduce(
      (sum, s) => sum + Number(s.amount),
      0,
    );

    // Project balance over next 3 months
    const projections = [];
    let projectedBalance = currentBalance;
    for (let i = 1; i <= 3; i++) {
      const month = addMonths(new Date(), i);
      projectedBalance = projectedBalance + avgMonthlyIncome - avgMonthlySpend - monthlySubscriptionCost;
      projections.push({
        month: format(month, 'MMMM yyyy'),
        projectedBalance: Math.max(0, projectedBalance),
        projectedSpend: avgMonthlySpend + monthlySubscriptionCost,
        projectedIncome: avgMonthlyIncome,
      });
    }

    const daysUntilZero =
      burnRate > 0 ? Math.floor(currentBalance / (burnRate / 30)) : 999;

    return {
      currentBalance,
      burnRate,
      avgMonthlySpend,
      avgMonthlyIncome,
      monthlySubscriptionCost,
      daysUntilZero,
      projections,
      recurringExpenses: upcomingSubscriptions.map((s) => ({
        name: s.name,
        amount: Number(s.amount),
        nextDue: s.nextDueDate,
      })),
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

    // Per-member projected spend
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
