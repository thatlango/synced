import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  private code() {
    return randomBytes(5).toString('base64url').replace(/[-_]/g, '').toUpperCase().slice(0, 8);
  }

  private deepLink(code: string) {
    return `synced://join?code=${encodeURIComponent(code)}`;
  }

  private shareLink(code: string) {
    const base = (process.env.SYNCED_PUBLIC_INVITE_BASE_URL ||
      'https://api.synced.tukutuku.org/api/v1/invites/open').replace(/\/$/, '');
    return `${base}/${encodeURIComponent(code)}`;
  }

  async create(userId: string, body: any) {
    const targetType = body.targetType === 'basket' ? 'basket' : 'household';
    const basketId = targetType === 'basket' ? body.basketId : null;
    const householdId = targetType === 'household' ? body.householdId : null;

    if (targetType === 'basket') {
      const basket = await this.prisma.basket.findUnique({
        where: { id: basketId },
        include: { members: true },
      });
      if (!basket) throw new NotFoundException('Basket not found');
      const member = basket.members.find((m) => m.userId === userId);
      if (basket.createdBy !== userId && member?.role !== 'owner') {
        throw new ForbiddenException('Only the Basket owner can invite people.');
      }
    } else {
      if (!householdId) throw new BadRequestException('Shared-space id is required');
      const membership = await this.prisma.householdMember.findUnique({
        where: { householdId_userId: { householdId, userId } },
      });
      if (!membership || membership.role !== 'admin') {
        throw new ForbiddenException('Only a shared-space admin can invite people.');
      }
    }

    let code = this.code();
    while (await this.prisma.invite.findUnique({ where: { code } })) code = this.code();

    const invite = await this.prisma.invite.create({
      data: {
        code,
        targetType,
        basketId,
        householdId,
        createdBy: userId,
        role: body.role || (targetType === 'basket' ? 'contributor' : 'member'),
        maxUses: Math.max(1, Math.min(100, Number(body.maxUses || 1))),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 7 * 86400000),
        metadata: body.metadata || undefined,
      },
    });

    return {
      ...invite,
      joinUrl: this.shareLink(code),
      qrPayload: this.deepLink(code),
    };
  }

  async preview(_userId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const invite = await this.prisma.invite.findUnique({
      where: { code },
      include: {
        household: { select: { id: true, name: true, avatar: true } },
        basket: { select: { id: true, name: true, description: true, targetAmount: true, targetDate: true } },
        creator: { select: { id: true, name: true } },
      },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    this.assertActive(invite);
    return {
      ...invite,
      qrPayload: this.deepLink(code),
      joinUrl: this.shareLink(code),
      target: invite.targetType === 'basket' ? invite.basket : invite.household,
    };
  }

  async redeem(userId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      const invite = await tx.invite.findUnique({ where: { code } });
      if (!invite) throw new NotFoundException('Invite not found');
      this.assertActive(invite);

      const priorRedemption = await tx.inviteRedemption.findUnique({
        where: { inviteId_userId: { inviteId: invite.id, userId } },
      });
      if (priorRedemption) {
        return {
          joined: true,
          duplicate: true,
          targetType: invite.targetType,
          basketId: invite.basketId,
          householdId: invite.householdId,
        };
      }

      // Existing members should not consume a finite invite use just by opening
      // or redeeming a link that points back to a space they already belong to.
      if (invite.targetType === 'basket' && invite.basketId) {
        const existing = await tx.basketMember.findUnique({
          where: { basketId_userId: { basketId: invite.basketId, userId } },
        });
        const basket = await tx.basket.findUnique({ where: { id: invite.basketId } });
        if (existing || basket?.createdBy === userId) {
          return {
            joined: true,
            duplicate: true,
            targetType: invite.targetType,
            basketId: invite.basketId,
            householdId: invite.householdId,
          };
        }

        const role = invite.role === 'viewer' ? 'viewer' : 'contributor';
        await tx.basketMember.create({
          data: { basketId: invite.basketId, userId, role },
        });
      } else if (invite.householdId) {
        const existing = await tx.householdMember.findUnique({
          where: { householdId_userId: { householdId: invite.householdId, userId } },
        });
        if (existing) {
          return {
            joined: true,
            duplicate: true,
            targetType: invite.targetType,
            basketId: invite.basketId,
            householdId: invite.householdId,
          };
        }
        await tx.householdMember.create({
          data: { householdId: invite.householdId, userId, role: 'member' },
        });
      } else {
        throw new BadRequestException('Invite target is unavailable');
      }

      await tx.inviteRedemption.create({ data: { inviteId: invite.id, userId } });
      const useCount = invite.useCount + 1;
      await tx.invite.update({
        where: { id: invite.id },
        data: {
          useCount,
          status: useCount >= invite.maxUses ? 'exhausted' : 'active',
        },
      });

      return {
        joined: true,
        targetType: invite.targetType,
        basketId: invite.basketId,
        householdId: invite.householdId,
      };
    });
  }

  async revoke(userId: string, id: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.createdBy !== userId) {
      throw new ForbiddenException('Only the creator can revoke this invite.');
    }
    return this.prisma.invite.update({ where: { id }, data: { status: 'revoked' } });
  }

  private assertActive(invite: any) {
    if (invite.status !== 'active') {
      throw new BadRequestException('This invite is no longer active.');
    }
    if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException('This invite has expired.');
    }
    if (invite.useCount >= invite.maxUses) {
      throw new BadRequestException('This invite has already been fully used.');
    }
  }
}
