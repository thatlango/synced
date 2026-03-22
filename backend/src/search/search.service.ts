import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(userId: string, query: string, limit = 20) {
    if (!query || query.trim().length < 2) {
      return { transactions: [], bills: [], subscriptions: [] };
    }

    const q = query.trim().toLowerCase();

    // Get user wallet IDs
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const householdWallets = await this.prisma.wallet.findMany({
      where: { household: { members: { some: { userId } } } },
    });
    const walletIds = [
      ...(wallet ? [wallet.id] : []),
      ...householdWallets.map((w) => w.id),
    ];

    const [transactions, bills, subscriptions] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          walletId: { in: walletIds },
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { merchant: { contains: q, mode: 'insensitive' } },
            { category: { equals: q as any } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
          wallet: { select: { type: true } },
        },
      }),
      this.prisma.bill.findMany({
        where: {
          OR: [{ userId }, { household: { members: { some: { userId } } } }],
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { provider: { contains: q, mode: 'insensitive' } },
          ],
        } as any,
        take: limit,
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.subscription.findMany({
        where: {
          OR: [
            { userId },
            { household: { members: { some: { userId } } } },
          ],
          name: { contains: q, mode: 'insensitive' },
        },
        take: limit,
      }),
    ]);

    return {
      transactions,
      bills,
      subscriptions,
      total: transactions.length + bills.length + subscriptions.length,
    };
  }
}
