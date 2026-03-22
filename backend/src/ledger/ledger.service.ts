import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async getEntriesByWallet(walletId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.ledgerEntry.count({ where: { walletId } }),
    ]);
    return { entries, total, page, limit };
  }

  async getEntriesByUser(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          wallet: { select: { id: true, type: true } },
        },
      }),
      this.prisma.ledgerEntry.count({ where: { userId } }),
    ]);
    return { entries, total, page, limit };
  }

  async getWalletBalance(walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    const lastEntry = await this.prisma.ledgerEntry.findFirst({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      walletId,
      currentBalance: wallet?.balance || 0,
      lastEntryBalance: lastEntry?.balanceAfter || 0,
    };
  }
}
