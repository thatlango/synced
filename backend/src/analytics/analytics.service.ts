import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async personalInsights(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return null;

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [thisMonthSpend, lastMonthSpend, byCategory, topMerchants, dailySpend] =
      await Promise.all([
        this.prisma.ledgerEntry.aggregate({
          where: { walletId: wallet.id, type: 'debit', createdAt: { gte: thisMonthStart } },
          _sum: { amount: true },
        }),
        this.prisma.ledgerEntry.aggregate({
          where: {
            walletId: wallet.id,
            type: 'debit',
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.ledgerEntry.groupBy({
          by: ['category'],
          where: { walletId: wallet.id, type: 'debit', createdAt: { gte: thisMonthStart } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
        }),
        this.prisma.transaction.groupBy({
          by: ['merchant'],
          where: {
            walletId: wallet.id,
            type: 'debit',
            merchant: { not: null },
            createdAt: { gte: thisMonthStart },
          },
          _sum: { amount: true },
          _count: { id: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: 5,
        }),
        this.getDailySpend(wallet.id, 30),
      ]);

    const thisMonthTotal = Number(thisMonthSpend._sum.amount || 0);
    const lastMonthTotal = Number(lastMonthSpend._sum.amount || 0);
    const spendChange =
      lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    return {
      thisMonth: {
        total: thisMonthTotal,
        change: Math.round(spendChange),
        trend: spendChange > 5 ? 'up' : spendChange < -5 ? 'down' : 'stable',
      },
      lastMonth: { total: lastMonthTotal },
      byCategory: byCategory.map((c) => ({
        category: c.category,
        amount: Number(c._sum.amount),
        percentage:
          thisMonthTotal > 0
            ? Math.round((Number(c._sum.amount) / thisMonthTotal) * 100)
            : 0,
      })),
      topMerchants: topMerchants
        .filter((m) => m.merchant)
        .map((m) => ({
          merchant: m.merchant,
          amount: Number(m._sum.amount),
          count: m._count.id,
        })),
      dailySpend,
    };
  }

  async householdInsights(householdId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { householdId } });
    if (!wallet) return null;

    const now = new Date();
    const thisMonthStart = startOfMonth(now);

    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { id: true, name: true } } },
    });

    // Per-member breakdown
    const memberBreakdown = await Promise.all(
      members.map(async (member) => {
        const [spent, byCategory] = await Promise.all([
          this.prisma.ledgerEntry.aggregate({
            where: {
              walletId: wallet.id,
              userId: member.userId,
              type: 'debit',
              createdAt: { gte: thisMonthStart },
            },
            _sum: { amount: true },
          }),
          this.prisma.ledgerEntry.groupBy({
            by: ['category'],
            where: {
              walletId: wallet.id,
              userId: member.userId,
              type: 'debit',
              createdAt: { gte: thisMonthStart },
            },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 3,
          }),
        ]);

        return {
          userId: member.userId,
          name: member.user.name,
          totalSpent: Number(spent._sum.amount || 0),
          topCategories: byCategory.map((c) => ({
            category: c.category,
            amount: Number(c._sum.amount),
          })),
        };
      }),
    );

    const [totalSpent, byCategory] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id, type: 'debit', createdAt: { gte: thisMonthStart } },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.groupBy({
        by: ['category'],
        where: { walletId: wallet.id, type: 'debit', createdAt: { gte: thisMonthStart } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    const totalSpentAmount = Number(totalSpent._sum.amount || 0);

    return {
      totalSpentThisMonth: totalSpentAmount,
      memberBreakdown: memberBreakdown.sort((a, b) => b.totalSpent - a.totalSpent),
      biggestSpender:
        memberBreakdown.length > 0
          ? memberBreakdown.reduce((max, m) => (m.totalSpent > max.totalSpent ? m : max))
          : null,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        amount: Number(c._sum.amount),
        percentage:
          totalSpentAmount > 0
            ? Math.round((Number(c._sum.amount) / totalSpentAmount) * 100)
            : 0,
      })),
    };
  }

  async monthlyTrends(userId: string, months = 6) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return [];

    const trends = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const [spend, income] = await Promise.all([
        this.prisma.ledgerEntry.aggregate({
          where: { walletId: wallet.id, type: 'debit', createdAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        this.prisma.ledgerEntry.aggregate({
          where: { walletId: wallet.id, type: 'credit', createdAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);

      trends.push({
        month: format(date, 'MMM yyyy'),
        spend: Number(spend._sum.amount || 0),
        income: Number(income._sum.amount || 0),
        net: Number(income._sum.amount || 0) - Number(spend._sum.amount || 0),
      });
    }

    return trends;
  }

  private async getDailySpend(walletId: string, days: number) {
    const result = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const spent = await this.prisma.ledgerEntry.aggregate({
        where: {
          walletId,
          type: 'debit',
          createdAt: { gte: date, lt: nextDate },
        },
        _sum: { amount: true },
      });

      result.push({
        date: format(date, 'MMM dd'),
        amount: Number(spent._sum.amount || 0),
      });
    }
    return result;
  }
}
