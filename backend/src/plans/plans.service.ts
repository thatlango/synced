import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { startOfMonth, endOfMonth } from 'date-fns';
@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}
  async current(userId: string) {
    const now = new Date();
    const plan = await this.prisma.plan.findFirst({
      where: { userId, status: 'active', startDate: { lte: now }, endDate: { gte: now } },
      include: { allocations: true }, orderBy: { createdAt: 'desc' },
    });
    if (!plan) return null;
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const spent = wallet ? await this.prisma.ledgerEntry.aggregate({
      where: { walletId: wallet.id, type: 'debit', createdAt: { gte: plan.startDate, lte: plan.endDate } }, _sum: { amount: true },
    }) : null;
    const allocationRows = await Promise.all(plan.allocations.map(async (a) => {
      const amount = wallet && a.category ? await this.prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id, type: 'debit', category: a.category, createdAt: { gte: plan.startDate, lte: plan.endDate } }, _sum: { amount: true },
      }) : null;
      return { ...a, plannedAmount: Number(a.plannedAmount), spentAmount: Number(amount?._sum.amount || 0) };
    }));
    const plannedTotal = allocationRows.reduce((sum, a) => sum + Number(a.plannedAmount), 0);
    const spentTotal = Number(spent?._sum.amount || 0);
    const expectedIncome = Number(plan.expectedIncome);
    const pace = expectedIncome > 0 ? spentTotal / expectedIncome : 0;
    return {
      ...plan,
      expectedIncome,
      plannedTotal,
      spentTotal,
      allocations: allocationRows,
      health: pace > 0.85 ? 'watch' : 'on_track',
      insight: pace > 0.85
        ? 'Spending is using most of the income planned for this period. Review flexible categories before the next large bill.'
        : 'Your plan is within the expected range. Keep the next bills and Basket contributions reserved before discretionary spending.',
    };
  }
  async create(userId: string, body: any) {
    const startDate = body.startDate ? new Date(body.startDate) : startOfMonth(new Date());
    const endDate = body.endDate ? new Date(body.endDate) : endOfMonth(startDate);
    if (!(startDate < endDate)) throw new BadRequestException('Plan dates are invalid.');
    await this.prisma.plan.updateMany({ where: { userId, status: 'active' }, data: { status: 'closed' } });
    return this.prisma.plan.create({
      data: {
        userId, label: body.label || startDate.toLocaleString('en', { month: 'long', year: 'numeric' }),
        currency: body.currency || 'UGX', expectedIncome: Number(body.expectedIncome || 0), startDate, endDate,
        allocations: { create: (body.allocations || []).map((a: any) => ({ label: a.label || a.category || 'Allocation', category: a.category || null, plannedAmount: Number(a.plannedAmount || 0), basketId: a.basketId || null, billId: a.billId || null })) },
      }, include: { allocations: true },
    });
  }
}
