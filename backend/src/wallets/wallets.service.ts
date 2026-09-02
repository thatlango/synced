import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FundWalletDto } from './dto/wallet.dto';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getPersonalWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Personal wallet not found');
    return wallet;
  }

  async getHouseholdWallet(householdId: string, userId: string) {
    await this.requireHouseholdMember(householdId, userId);
    const wallet = await this.prisma.wallet.findUnique({
      where: { householdId },
    });
    if (!wallet) throw new NotFoundException('Shared-space wallet not found');
    return wallet;
  }

  async fundWallet(walletId: string, userId: string, dto: FundWalletDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: { household: { select: { id: true } } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    await this.requireWalletAccess(wallet, userId);

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + dto.amount;
    const visibility = wallet.type === 'household' ? 'household' : 'personal';
    const description = wallet.type === 'household' ? 'Shared-space contribution' : 'Wallet funding';

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          walletId,
          userId,
          type: 'credit',
          amount: dto.amount,
          category: 'transfer',
          description,
          source: (dto.source as any) || 'manual',
          visibility,
          referenceId: dto.referenceId || undefined,
        },
      });

      const updated = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: dto.amount } },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId,
          userId,
          transactionId: transaction.id,
          type: 'credit',
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          category: 'transfer',
          source: (dto.source as any) || 'manual',
          visibility,
          description,
          referenceId: dto.referenceId || transaction.id,
        },
      });

      return updated;
    });
  }

  async getWalletSummary(userId: string) {
    const [personalWallet, householdMemberships] = await Promise.all([
      this.prisma.wallet.findUnique({ where: { userId } }),
      this.prisma.householdMember.findMany({
        where: { userId },
        include: {
          household: {
            include: { wallet: true },
          },
        },
      }),
    ]);

    const householdWallets = householdMemberships
      .filter((m) => m.household.wallet)
      .map((m) => ({
        householdId: m.householdId,
        householdName: m.household.name,
        wallet: m.household.wallet,
        role: m.role,
      }));

    const totalHouseholdBalance = householdWallets.reduce(
      (sum, h) => sum + Number(h.wallet?.balance || 0),
      0,
    );

    return {
      personal: personalWallet,
      households: householdWallets,
      summary: {
        personalBalance: Number(personalWallet?.balance || 0),
        totalHouseholdBalance,
        combinedBalance: Number(personalWallet?.balance || 0) + totalHouseholdBalance,
      },
    };
  }

  async getLedgerHistory(walletId: string, userId: string, page = 1, limit = 20) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: { household: { select: { id: true } } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    await this.requireWalletAccess(wallet, userId);

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;
    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.ledgerEntry.count({ where: { walletId } }),
    ]);
    return { entries, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
  }

  private async requireWalletAccess(wallet: any, userId: string) {
    if (wallet.userId === userId) return;
    if (wallet.householdId) {
      await this.requireHouseholdMember(wallet.householdId, userId);
      return;
    }
    throw new ForbiddenException('Wallet access denied');
  }

  private async requireHouseholdMember(householdId: string, userId: string) {
    const membership = await this.prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId } },
    });
    if (!membership) throw new ForbiddenException('Shared-space membership required');
    return membership;
  }
}
