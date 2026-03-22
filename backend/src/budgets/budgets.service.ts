import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    return this.prisma.budget.upsert({
      where: {
        ownerType_userId_householdId_category_period: {
          ownerType: (dto.ownerType as any) || 'user',
          userId: dto.ownerType === 'household' ? null : userId,
          householdId: dto.ownerType === 'household' ? dto.householdId : null,
          category: dto.category as any,
          period: (dto.period as any) || 'monthly',
        },
      },
      update: { limitAmount: dto.limitAmount },
      create: {
        ownerType: (dto.ownerType as any) || 'user',
        userId: dto.ownerType === 'household' ? null : userId,
        householdId: dto.ownerType === 'household' ? dto.householdId : null,
        category: dto.category as any,
        limitAmount: dto.limitAmount,
        period: (dto.period as any) || 'monthly',
      },
    });
  }

  async findAll(userId: string) {
    const householdIds = await this.prisma.householdMember
      .findMany({ where: { userId }, select: { householdId: true } })
      .then((m) => m.map((x) => x.householdId));

    const budgets = await this.prisma.budget.findMany({
      where: {
        OR: [
          { userId, ownerType: 'user' },
          { householdId: { in: householdIds }, ownerType: 'household' },
        ],
      },
    });

    // Enrich each budget with current usage
    const now = new Date();
    const budgetsWithUsage = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = this.getPeriodStart(budget.period, now);

        let walletIds: string[] = [];
        if (budget.ownerType === 'user' && budget.userId) {
          const wallet = await this.prisma.wallet.findUnique({
            where: { userId: budget.userId },
          });
          if (wallet) walletIds = [wallet.id];
        } else if (budget.ownerType === 'household' && budget.householdId) {
          const wallet = await this.prisma.wallet.findUnique({
            where: { householdId: budget.householdId },
          });
          if (wallet) walletIds = [wallet.id];
        }

        const spent = await this.prisma.ledgerEntry.aggregate({
          where: {
            walletId: { in: walletIds },
            category: budget.category,
            type: 'debit',
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
        });

        const spentAmount = Number(spent._sum.amount || 0);
        const limitAmount = Number(budget.limitAmount);

        return {
          ...budget,
          spentAmount,
          remainingAmount: limitAmount - spentAmount,
          usagePercent: limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 100) : 0,
          isOverBudget: spentAmount > limitAmount,
        };
      }),
    );

    return budgetsWithUsage;
  }

  async delete(id: string) {
    return this.prisma.budget.delete({ where: { id } });
  }

  private getPeriodStart(period: string, now: Date): Date {
    switch (period) {
      case 'daily': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly': {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay());
        return d;
      }
      case 'monthly': return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarterly': {
        const q = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), q * 3, 1);
      }
      case 'annually': return new Date(now.getFullYear(), 0, 1);
      default: return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
}
