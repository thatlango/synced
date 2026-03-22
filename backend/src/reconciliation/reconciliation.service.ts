import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private prisma: PrismaService) {}

  async reconcileWallet(walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) return null;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [credits, debits, lastEntry] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { walletId, type: 'credit', createdAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { walletId, type: 'debit', createdAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.findFirst({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalCredits = Number(credits._sum.amount || 0);
    const totalDebits = Number(debits._sum.amount || 0);
    const currentBalance = Number(wallet.balance);
    const expectedBalance = lastEntry ? Number(lastEntry.balanceAfter) : 0;
    const discrepancy = currentBalance - expectedBalance;

    const log = await this.prisma.reconciliationLog.create({
      data: {
        walletId,
        openingBalance: expectedBalance,
        closingBalance: currentBalance,
        totalCredits,
        totalDebits,
        discrepancy,
        notes:
          discrepancy !== 0
            ? `Discrepancy detected: UGX ${discrepancy}`
            : 'Balanced',
      },
    });

    if (discrepancy !== 0) {
      this.logger.warn(
        `Reconciliation discrepancy for wallet ${walletId}: UGX ${discrepancy}`,
      );
    }

    return log;
  }

  async reconcileAllWallets() {
    const wallets = await this.prisma.wallet.findMany({ select: { id: true } });
    const results = await Promise.all(
      wallets.map((w) => this.reconcileWallet(w.id)),
    );
    this.logger.log(`Reconciled ${wallets.length} wallets`);
    return { reconciled: results.length, results };
  }

  async getReconciliationLogs(walletId: string, limit = 10) {
    return this.prisma.reconciliationLog.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
