import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SyncedAiClient } from '../ai/synced-ai.client';
import { addDays, differenceInCalendarDays, startOfMonth, subMonths } from 'date-fns';

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: SyncedAiClient,
  ) {}

  async financialContext(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return {
        currency: 'UGX',
        balance: 0,
        monthSpend: 0,
        monthIncome: 0,
        priorThreeMonthSpend: 0,
        upcomingBills: [],
        upcomingSubscriptions: [],
        upcomingObligations: [],
        baskets: [],
        plan: null,
      };
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const threeMonths = subMonths(now, 3);
    const obligationCutoff = addDays(now, 30);

    const [spent, income, previousSpend, bills, subscriptions, baskets, plan] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id, type: 'debit', createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id, type: 'credit', createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id, type: 'debit', createdAt: { gte: threeMonths, lt: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.bill.findMany({
        where: {
          OR: [{ userId }, { household: { members: { some: { userId } } } }],
          isPaid: false,
          dueDate: { lte: obligationCutoff },
        },
        orderBy: { dueDate: 'asc' },
        take: 12,
        select: { name: true, amount: true, dueDate: true, recurring: true, category: true },
      }),
      this.prisma.subscription.findMany({
        where: {
          OR: [{ userId }, { household: { members: { some: { userId } } } }],
          status: 'active',
          nextDueDate: { lte: obligationCutoff },
        },
        orderBy: { nextDueDate: 'asc' },
        take: 12,
        select: { name: true, amount: true, nextDueDate: true, billingCycle: true, category: true },
      }),
      this.prisma.basket.findMany({
        where: { status: 'active', OR: [{ createdBy: userId }, { members: { some: { userId } } }] },
        include: { contributions: { select: { amount: true } } },
        take: 8,
      }),
      this.prisma.plan.findFirst({
        where: { userId, status: 'active', startDate: { lte: now }, endDate: { gte: now } },
        include: { allocations: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const upcomingBills = bills.map((bill) => ({
      type: 'bill',
      name: bill.name,
      category: bill.category,
      amount: Number(bill.amount),
      dueDate: bill.dueDate,
      recurring: bill.recurring,
    }));
    const upcomingSubscriptions = subscriptions.map((subscription) => ({
      type: 'subscription',
      name: subscription.name,
      category: subscription.category,
      amount: Number(subscription.amount),
      dueDate: subscription.nextDueDate,
      recurring: true,
      billingCycle: subscription.billingCycle,
    }));
    const upcomingObligations = [...upcomingBills, ...upcomingSubscriptions]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return {
      currency: wallet.currency,
      balance: Number(wallet.balance),
      monthSpend: Number(spent._sum.amount || 0),
      monthIncome: Number(income._sum.amount || 0),
      priorThreeMonthSpend: Number(previousSpend._sum.amount || 0),
      upcomingBills,
      upcomingSubscriptions,
      upcomingObligations,
      baskets: baskets.map((basket) => ({
        name: basket.name,
        targetAmount: basket.targetAmount ? Number(basket.targetAmount) : null,
        savedAmount: basket.contributions.reduce((total, contribution) => total + Number(contribution.amount), 0),
        targetDate: basket.targetDate,
      })),
      plan: plan
        ? {
            label: plan.label,
            expectedIncome: Number(plan.expectedIncome),
            allocations: plan.allocations.map((allocation) => ({
              label: allocation.label,
              category: allocation.category,
              plannedAmount: Number(allocation.plannedAmount),
            })),
          }
        : null,
    };
  }

  async summary(userId: string) {
    const context: any = await this.financialContext(userId);
    const avgPrior = context.priorThreeMonthSpend / 3;
    const delta = avgPrior > 0
      ? Math.round(((context.monthSpend - avgPrior) / avgPrior) * 100)
      : 0;
    const spendingInsight = delta > 10
      ? `Spending is ${delta}% above your recent monthly average.`
      : delta < -10
        ? `Spending is ${Math.abs(delta)}% below your recent monthly average.`
        : 'Spending is close to your recent monthly pattern.';

    const obligations = context.upcomingObligations || [];
    const nextBill = obligations[0] || null;
    const totalDue = obligations.reduce((sum: number, obligation: any) => sum + Number(obligation.amount || 0), 0);
    const shortfall = Math.max(totalDue - Number(context.balance || 0), 0);
    const remainingAfterReserve = Math.max(Number(context.balance || 0) - totalDue, 0);
    const daysToNext = nextBill
      ? differenceInCalendarDays(new Date(nextBill.dueDate), new Date())
      : null;

    let obligationInsight: string | null = null;
    if (nextBill) {
      const timing = daysToNext! < 0
        ? `${Math.abs(daysToNext!)} day${Math.abs(daysToNext!) === 1 ? '' : 's'} overdue`
        : daysToNext === 0
          ? 'due today'
          : `due in ${daysToNext} day${daysToNext === 1 ? '' : 's'}`;
      const obligationCount = obligations.length;
      const totalText = this.money(totalDue, context.currency);
      const coverage = shortfall > 0
        ? `Your recorded balance is short by ${this.money(shortfall, context.currency)}.`
        : `Reserving ${totalText} would leave ${this.money(remainingAfterReserve, context.currency)} before other spending.`;
      obligationInsight = `${nextBill.name} is ${timing}. ${totalText} is due across ${obligationCount} obligation${obligationCount === 1 ? '' : 's'} in the next 30 days. ${coverage}`;
    }

    return {
      financialState: context,
      trend: {
        spendingVsPriorAveragePercent: delta,
        direction: delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable',
      },
      nextBill,
      obligationSummary: {
        totalDueNext30Days: totalDue,
        count: obligations.length,
        shortfall,
        remainingAfterReserve,
      },
      spendingInsight,
      obligationInsight,
      deterministicInsight: obligationInsight || spendingInsight,
    };
  }

  async ask(userId: string, question: string) {
    const context = await this.financialContext(userId);
    const result = await this.ai.assist({
      capability: 'explain',
      subjectRef: `synced-user:${userId}`,
      instruction: `Answer the user's personal finance question using only the supplied Synced financial state. Prioritise overdue and near-term bills or subscriptions when they materially affect available money. Do not invent balances, transactions or obligations. Separate observed facts from suggestions. Do not provide regulated investment, lending or tax advice. Question: ${question || 'What should I pay attention to in my finances right now?'}`,
      context,
    });
    return {
      answer: result,
      evidenceBoundary: 'Synced ledger, plan, Basket, bill and subscription summaries supplied in this request.',
      processedVia: 'tuku-core-ai',
    };
  }

  private money(amount: number, currency = 'UGX') {
    return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
  }
}
