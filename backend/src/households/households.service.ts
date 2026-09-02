import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { InvitesService } from '../invites/invites.service';
import { CreateHouseholdDto, JoinHouseholdDto, UpdateHouseholdDto } from './dto/household.dto';

@Injectable()
export class HouseholdsService {
  constructor(
    private prisma: PrismaService,
    private invites: InvitesService,
  ) {}

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

      const wallet = await tx.wallet.create({
        data: {
          type: 'household',
          householdId: household.id,
          balance: 0,
        },
      });

      return {
        ...household,
        wallet,
        role: 'admin',
        _count: { members: household.members.length },
      };
    });
  }

  // Legacy permanent household codes remain supported. Current Android invites
  // use revocable/expiring short codes managed by InvitesService.
  async join(userId: string, dto: JoinHouseholdDto) {
    const rawCode = dto.inviteCode.trim();
    const household = await this.prisma.household.findUnique({
      where: { inviteCode: rawCode },
    });

    if (household) {
      const existing = await this.prisma.householdMember.findUnique({
        where: { householdId_userId: { householdId: household.id, userId } },
      });
      if (existing) throw new ConflictException('Already a member of this shared space');

      await this.prisma.householdMember.create({
        data: { householdId: household.id, userId, role: 'member' },
      });

      return this.findById(household.id, userId);
    }

    const modern = await this.invites.preview(userId, rawCode);
    if (modern.targetType !== 'household' || !modern.householdId) {
      throw new BadRequestException('This invite is not for a shared space.');
    }

    await this.invites.redeem(userId, rawCode);
    return this.findById(modern.householdId, userId);
  }

  async findById(id: string, requestingUserId: string) {
    await this.requireMember(id, requestingUserId);

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
                avatar: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });
    if (!household) throw new NotFoundException('Shared space not found');
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
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => ({ ...m.household, role: m.role, joinedAt: m.joinedAt }));
  }

  async getHouseholdFinancialSummary(householdId: string, requestingUserId: string) {
    await this.requireMember(householdId, requestingUserId);

    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: {
        wallet: true,
        members: { select: { userId: true, user: { select: { id: true, name: true } } } },
      },
    });
    if (!household) throw new NotFoundException('Shared space not found');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const memberBreakdown = await Promise.all(
      household.members.map(async (member) => {
        const [spent, earned] = await Promise.all([
          this.prisma.ledgerEntry.aggregate({
            where: {
              walletId: household.wallet?.id,
              userId: member.userId,
              type: 'debit',
              createdAt: { gte: startOfMonth },
            },
            _sum: { amount: true },
          }),
          this.prisma.ledgerEntry.aggregate({
            where: {
              walletId: household.wallet?.id,
              userId: member.userId,
              type: 'credit',
              createdAt: { gte: startOfMonth },
            },
            _sum: { amount: true },
          }),
        ]);

        return {
          userId: member.userId,
          name: member.user.name,
          totalSpent: Number(spent._sum.amount || 0),
          totalEarned: Number(earned._sum.amount || 0),
        };
      }),
    );

    const totalSpent = memberBreakdown.reduce((sum, m) => sum + m.totalSpent, 0);
    const totalEarned = memberBreakdown.reduce((sum, m) => sum + m.totalEarned, 0);

    return {
      household: {
        id: household.id,
        name: household.name,
        walletBalance: Number(household.wallet?.balance || 0),
      },
      totalSpentThisMonth: totalSpent,
      totalEarnedThisMonth: totalEarned,
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
    if (!member) throw new NotFoundException('Not a member of this shared space');

    const adminCount = await this.prisma.householdMember.count({
      where: { householdId: id, role: 'admin' },
    });
    if (member.role === 'admin' && adminCount === 1) {
      throw new BadRequestException('Cannot leave: you are the only admin. Transfer admin role first.');
    }

    await this.prisma.householdMember.delete({
      where: { householdId_userId: { householdId: id, userId } },
    });
    return { message: 'Left shared space successfully' };
  }

  async removeMember(householdId: string, adminId: string, memberId: string) {
    await this.requireAdmin(householdId, adminId);
    if (adminId === memberId) throw new BadRequestException('Cannot remove yourself');

    const target = await this.prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId: memberId } },
    });
    if (!target) throw new NotFoundException('Member not found in this shared space');

    await this.prisma.householdMember.delete({
      where: { householdId_userId: { householdId, userId: memberId } },
    });
    return { message: 'Member removed successfully' };
  }

  private async requireMember(householdId: string, userId: string) {
    const member = await this.prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId } },
    });
    if (!member) throw new ForbiddenException('Shared-space membership required');
    return member;
  }

  private async requireAdmin(householdId: string, userId: string) {
    const member = await this.requireMember(householdId, userId);
    if (member.role !== 'admin') {
      throw new ForbiddenException('Shared-space admin access required');
    }
    return member;
  }
}
