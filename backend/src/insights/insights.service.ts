import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SyncedAiClient } from '../ai/synced-ai.client';
import { startOfMonth, subMonths } from 'date-fns';
@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService, private readonly ai: SyncedAiClient) {}
  async financialContext(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { currency: 'UGX', balance: 0, monthSpend: 0, monthIncome: 0, baskets: [], bills: [] };
    const now = new Date(); const monthStart = startOfMonth(now); const threeMonths = subMonths(now, 3);
    const [spent, income, previousSpend, bills, baskets, plan] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({ where: { walletId: wallet.id, type: 'debit', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
      this.prisma.ledgerEntry.aggregate({ where: { walletId: wallet.id, type: 'credit', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
      this.prisma.ledgerEntry.aggregate({ where: { walletId: wallet.id, type: 'debit', createdAt: { gte: threeMonths, lt: monthStart } }, _sum: { amount: true } }),
      this.prisma.bill.findMany({ where: { OR: [{ userId }, { household: { members: { some: { userId } } } }], isPaid: false, dueDate: { gte: now } }, orderBy: { dueDate: 'asc' }, take: 8, select: { name: true, amount: true, dueDate: true, recurring: true } }),
      this.prisma.basket.findMany({ where: { status: 'active', OR: [{ createdBy: userId }, { members: { some: { userId } } }] }, include: { contributions: { select: { amount: true } } }, take: 8 }),
      this.prisma.plan.findFirst({ where: { userId, status: 'active', startDate: { lte: now }, endDate: { gte: now } }, include: { allocations: true }, orderBy: { createdAt: 'desc' } }),
    ]);
    return {
      currency: wallet.currency, balance: Number(wallet.balance), monthSpend: Number(spent._sum.amount || 0), monthIncome: Number(income._sum.amount || 0),
      priorThreeMonthSpend: Number(previousSpend._sum.amount || 0),
      upcomingBills: bills.map((b) => ({ name: b.name, amount: Number(b.amount), dueDate: b.dueDate, recurring: b.recurring })),
      baskets: baskets.map((b) => ({ name: b.name, targetAmount: b.targetAmount ? Number(b.targetAmount) : null, savedAmount: b.contributions.reduce((x, c) => x + Number(c.amount), 0), targetDate: b.targetDate })),
      plan: plan ? { label: plan.label, expectedIncome: Number(plan.expectedIncome), allocations: plan.allocations.map((a) => ({ label: a.label, category: a.category, plannedAmount: Number(a.plannedAmount) })) } : null,
    };
  }
  async summary(userId: string) {
    const context: any = await this.financialContext(userId);
    const avgPrior = context.priorThreeMonthSpend / 3;
    const delta = avgPrior > 0 ? Math.round(((context.monthSpend - avgPrior) / avgPrior) * 100) : 0;
    const nextBill = context.upcomingBills[0] || null;
    return {
      financialState: context,
      trend: { spendingVsPriorAveragePercent: delta, direction: delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable' },
      nextBill,
      deterministicInsight: delta > 10 ? `Spending is ${delta}% above your recent monthly average.` : delta < -10 ? `Spending is ${Math.abs(delta)}% below your recent monthly average.` : 'Spending is close to your recent monthly pattern.',
    };
  }
  async ask(userId: string, question: string) {
    const context = await this.financialContext(userId);
    const result = await this.ai.assist({
      capability: 'explain', subjectRef: `synced-user:${userId}`,
      instruction: `Answer the user's personal finance question using only the supplied Synced financial state. Do not invent balances, transactions or obligations. Separate observed facts from suggestions. Do not provide regulated investment, lending or tax advice. Question: ${question || 'What should I pay attention to in my finances right now?'}`,
      context,
    });
    return { answer: result, evidenceBoundary: 'Synced ledger, plan, Basket and bill summaries supplied in this request.', processedVia: 'tuku-core-ai' };
  }
}
