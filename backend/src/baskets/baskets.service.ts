import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
@Injectable()
export class BasketsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(userId: string) {
    const baskets = await this.prisma.basket.findMany({
      where: { status: { in: ['active', 'paused'] }, OR: [{ createdBy: userId }, { members: { some: { userId } } }] },
      include: { members: { include: { user: { select: { id: true, name: true } } } }, contributions: true }, orderBy: { updatedAt: 'desc' },
    });
    return baskets.map((b) => this.summary(b));
  }
  async detail(userId: string, id: string) {
    const basket = await this.prisma.basket.findUnique({ where: { id }, include: { members: { include: { user: { select: { id: true, name: true } } } }, contributions: { include: { user: { select: { id: true, name: true } } }, orderBy: { contributedAt: 'desc' } } } });
    if (!basket) throw new NotFoundException('Basket not found');
    if (basket.createdBy !== userId && !basket.members.some((m) => m.userId === userId)) throw new ForbiddenException('You do not have access to this Basket.');
    return this.summary(basket);
  }
  async create(userId: string, body: any) {
    const basket = await this.prisma.basket.create({ data: { name: String(body.name || '').trim(), description: body.description || null, currency: body.currency || 'UGX', targetAmount: body.targetAmount ? Number(body.targetAmount) : null, targetDate: body.targetDate ? new Date(body.targetDate) : null, householdId: body.householdId || null, createdBy: userId, members: { create: { userId, role: 'owner' } } }, include: { members: true, contributions: true } });
    return this.summary(basket);
  }
  async contribute(userId: string, basketId: string, body: any) {
    const basket = await this.prisma.basket.findUnique({ where: { id: basketId }, include: { members: true } });
    if (!basket) throw new NotFoundException('Basket not found');
    if (basket.createdBy !== userId && !basket.members.some((m) => m.userId === userId && m.role !== 'viewer')) throw new ForbiddenException('This Basket does not allow you to contribute.');
    const contribution = await this.prisma.basketContribution.create({ data: { basketId, userId, amount: Number(body.amount || 0), source: body.source || 'manual', transactionId: body.transactionId || null, note: body.note || null } });
    return { contribution, basket: await this.detail(userId, basketId) };
  }
  private summary(b: any) {
    const savedAmount = (b.contributions || []).reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    const targetAmount = b.targetAmount == null ? null : Number(b.targetAmount);
    return { ...b, targetAmount, savedAmount, progressPercent: targetAmount && targetAmount > 0 ? Math.min(100, Math.round((savedAmount / targetAmount) * 100)) : null };
  }
}
