import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async getHouseholdWallet(householdId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { householdId },
    });
    if (!wallet) throw new NotFoundException('Household wallet not found');
    return wallet;
  }

  async fundWallet(walletId: string, userId: string, dto: FundWalletDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + dto.amount;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: dto.amount } },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId,
          userId,
          type: 'credit',
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          source: (dto.source as any) || 'manual',
          visibility: wallet.type === 'personal' ? 'personal' : 'household',
          description: `Wallet funded via ${dto.source || 'manual'}`,
          referenceId: dto.referenceId,
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

  async getLedgerHistory(walletId: string, page = 1, limit = 20) {
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
    return { entries, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
