import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { addDays } from 'date-fns';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async getAlerts(userId: string, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;
    return this.prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(alertId: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { status: 'read' },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.alert.updateMany({
      where: { userId, status: 'unread' },
      data: { status: 'read' },
    });
  }

  async dismiss(alertId: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { status: 'dismissed' },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.alert.count({
      where: { userId, status: 'unread' },
    });
    return { count };
  }

  // ─── Alert Generation ─────────────────────────────────────────

  async checkAndGenerateAlerts(userId: string) {
    const generated = [];

    // 1. Check low balance
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (wallet && Number(wallet.balance) < 50000) {
      const alert = await this.createAlert(
        userId,
        'low_balance',
        'Low Balance Warning',
        `Your personal wallet balance is UGX ${Number(wallet.balance).toLocaleString()}. Consider funding your wallet.`,
      );
      generated.push(alert);
    }

    // 2. Check upcoming bills
    const upcomingBills = await this.prisma.bill.findMany({
      where: {
        OR: [{ userId }],
        isPaid: false,
        dueDate: { lte: addDays(new Date(), 3) },
      },
    });
    for (const bill of upcomingBills) {
      const alert = await this.createAlert(
        userId,
        'upcoming_bill',
        `Bill Due Soon: ${bill.name}`,
        `${bill.name} of UGX ${Number(bill.amount).toLocaleString()} is due on ${bill.dueDate.toDateString()}.`,
      );
      generated.push(alert);
    }

    // 3. Check budget overspending
    const budgets = await this.prisma.budget.findMany({ where: { userId } });
    for (const budget of budgets) {
      if (!wallet) continue;
      const spent = await this.prisma.ledgerEntry.aggregate({
        where: {
          walletId: wallet.id,
          category: budget.category,
          type: 'debit',
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      });
      const spentAmount = Number(spent._sum.amount || 0);
      if (spentAmount > Number(budget.limitAmount)) {
        const alert = await this.createAlert(
          userId,
          'budget_exceeded',
          `Budget Exceeded: ${budget.category}`,
          `You've spent UGX ${spentAmount.toLocaleString()} on ${budget.category}, exceeding your budget of UGX ${Number(budget.limitAmount).toLocaleString()}.`,
        );
        generated.push(alert);
      }
    }

    return { generated: generated.length, alerts: generated };
  }

  private async createAlert(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: any,
  ) {
    // Avoid duplicate alerts for the same type today
    const existing = await this.prisma.alert.findFirst({
      where: {
        userId,
        type: type as any,
        title,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });
    if (existing) return existing;

    return this.prisma.alert.create({
      data: { userId, type: type as any, title, message, metadata },
    });
  }
}
