import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateHouseholdDto, JoinHouseholdDto, UpdateHouseholdDto } from './dto/household.dto';

@Injectable()
export class HouseholdsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateHouseholdDto) {
    return this.prisma.$transaction(async (tx) => {
      const household = await tx.household.create({
        data: {
          name: dto.name,
          avatar: dto.avatar,
          createdBy: userId,
          members: {
            create: { userId, role: 'admin' },
          },
        },
        include: { members: true },
      });

      // Create household wallet
      await tx.wallet.create({
        data: {
          type: 'household',
          householdId: household.id,
          balance: 0,
        },
      });

      return household;
    });
  }

  async join(userId: string, dto: JoinHouseholdDto) {
    const household = await this.prisma.household.findUnique({
      where: { inviteCode: dto.inviteCode },
    });
    if (!household) throw new NotFoundException('Invalid invite code');

    const existing = await this.prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: household.id, userId } },
    });
    if (existing) throw new ConflictException('Already a member of this household');

    await this.prisma.householdMember.create({
      data: { householdId: household.id, userId, role: 'member' },
    });

    return this.findById(household.id, userId);
  }

  async findById(id: string, requestingUserId?: string) {
    const household = await this.prisma.household.findUnique({
      where: { id },
      include: {
        wallet: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatar: true,
                personalWallet: { select: { balance: true } },
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });
    if (!household) throw new NotFoundException('Household not found');
    return household;
  }

  async getMyHouseholds(userId: string) {
    const memberships = await this.prisma.householdMember.findMany({
      where: { userId },
      include: {
        household: {
          include: {
            wallet: true,
            _count: { select: { members: true } },
          },
        },
      },
    });
    return memberships.map((m) => ({ ...m.household, role: m.role, joinedAt: m.joinedAt }));
  }

  async getHouseholdFinancialSummary(householdId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: {
        wallet: true,
        members: { select: { userId: true, user: { select: { id: true, name: true } } } },
      },
    });
    if (!household) throw new NotFoundException('Household not found');

    // Get all ledger entries for this wallet
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const memberBreakdown = await Promise.all(
      household.members.map(async (member) => {
        const spent = await this.prisma.ledgerEntry.aggregate({
          where: {
            walletId: household.wallet?.id,
            userId: member.userId,
            type: 'debit',
            createdAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
        });

        const earned = await this.prisma.ledgerEntry.aggregate({
          where: {
            walletId: household.wallet?.id,
            userId: member.userId,
            type: 'credit',
            createdAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
        });

        return {
          userId: member.userId,
          name: member.user.name,
          totalSpent: spent._sum.amount || 0,
          totalEarned: earned._sum.amount || 0,
        };
      }),
    );

    const totalSpent = memberBreakdown.reduce((sum, m) => sum + Number(m.totalSpent), 0);

    return {
      household: {
        id: household.id,
        name: household.name,
        walletBalance: household.wallet?.balance || 0,
      },
      totalSpentThisMonth: totalSpent,
      memberBreakdown,
    };
  }

  async update(id: string, userId: string, dto: UpdateHouseholdDto) {
    await this.requireAdmin(id, userId);
    return this.prisma.household.update({ where: { id }, data: dto });
  }

  async leave(id: string, userId: string) {
    const member = await this.prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: id, userId } },
    });
    if (!member) throw new NotFoundException('Not a member of this household');

    const adminCount = await this.prisma.householdMember.count({
      where: { householdId: id, role: 'admin' },
    });
    if (member.role === 'admin' && adminCount === 1) {
      throw new BadRequestException('Cannot leave: you are the only admin. Transfer admin role first.');
    }

    await this.prisma.householdMember.delete({
      where: { householdId_userId: { householdId: id, userId } },
    });
    return { message: 'Left household successfully' };
  }

  async removeMember(householdId: string, adminId: string, memberId: string) {
    await this.requireAdmin(householdId, adminId);
    if (adminId === memberId) throw new BadRequestException('Cannot remove yourself');
    await this.prisma.householdMember.delete({
      where: { householdId_userId: { householdId, userId: memberId } },
    });
    return { message: 'Member removed successfully' };
  }

  private async requireAdmin(householdId: string, userId: string) {
    const member = await this.prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId } },
    });
    if (!member || member.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }
}
