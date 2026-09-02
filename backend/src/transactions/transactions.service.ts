import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CategorizationService } from '../categorization/categorization.service';
import { CreateTransactionDto, FilterTransactionsDto } from './dto/transaction.dto';
import { buildPaginationMeta } from '../common/utils/pagination';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private categorization: CategorizationService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        id: dto.walletId,
        OR: [
          { userId },
          { household: { members: { some: { userId } } } },
        ],
      },
    });
    if (!wallet) throw new NotFoundException('Wallet not found or not available to this account');

    if (dto.type === 'debit' && Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Auto-categorize if not provided
    const category =
      dto.category ||
      this.categorization.categorize(dto.description || '', dto.merchant);

    const balanceBefore = Number(wallet.balance);
    const balanceAfter =
      dto.type === 'credit'
        ? balanceBefore + dto.amount
        : balanceBefore - dto.amount;

    return this.prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: dto.walletId,
          userId,
          type: dto.type as any,
          amount: dto.amount,
          category: category as any,
          description: dto.description,
          merchant: dto.merchant,
          source: (dto.source as any) || 'manual',
          visibility: (dto.visibility as any) || 'personal',
          referenceId: dto.referenceId || undefined,
          metadata: dto.metadata as any,
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: dto.walletId },
        data: {
          balance:
            dto.type === 'credit'
              ? { increment: dto.amount }
              : { decrement: dto.amount },
        },
      });

      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          walletId: dto.walletId,
          userId,
          transactionId: transaction.id,
          type: dto.type as any,
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          category: category as any,
          source: (dto.source as any) || 'manual',
          visibility: (dto.visibility as any) || 'personal',
          description: dto.description,
          referenceId: dto.referenceId || transaction.id,
        },
      });

      return transaction;
    });
  }

  async findAll(userId: string, dto: FilterTransactionsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // Get user's wallets
    const userWallets = await this.prisma.wallet.findMany({
      where: { userId },
    });
    const householdWallets = await this.prisma.wallet.findMany({
      where: {
        household: {
          members: { some: { userId } },
        },
      },
    });

    let walletIds: string[] = [];
    if (dto.scope === 'personal') {
      walletIds = userWallets.map((w) => w.id);
    } else if (dto.scope === 'household') {
      walletIds = householdWallets.map((w) => w.id);
    } else {
      walletIds = [
        ...userWallets.map((w) => w.id),
        ...householdWallets.map((w) => w.id),
      ];
    }

    if (dto.walletId) walletIds = [dto.walletId];

    const where: any = { walletId: { in: walletIds } };
    if (dto.category) where.category = dto.category;
    if (dto.type) where.type = dto.type;
    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, phone: true } },
          wallet: { select: { id: true, type: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findById(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        wallet: true,
        ledgerEntry: true,
      },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async getSpendingSummary(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;
    if (period === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else startDate = new Date(now.getFullYear(), 0, 1);

    // Get personal wallet
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const [totalSpent, totalEarned, byCategory] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id, type: 'debit', createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id, type: 'credit', createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.groupBy({
        by: ['category'],
        where: { walletId: wallet.id, type: 'debit', createdAt: { gte: startDate } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    return {
      period,
      startDate,
      totalSpent: Number(totalSpent._sum.amount || 0),
      totalEarned: Number(totalEarned._sum.amount || 0),
      netFlow: Number(totalEarned._sum.amount || 0) - Number(totalSpent._sum.amount || 0),
      byCategory: byCategory.map((c) => ({
        category: c.category,
        amount: Number(c._sum.amount),
      })),
    };
  }
}
