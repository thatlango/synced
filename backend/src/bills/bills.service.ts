import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBillDto } from './dto/bill.dto';
import { addDays, addMonths, addWeeks, addQuarters, addYears, differenceInCalendarDays } from 'date-fns';

type RecurringCandidate = {
  fingerprint: string;
  name: string;
  category: string;
  amount: number;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  nextDueDate: Date;
  occurrences: number;
  confidence: number;
  cadenceDays: number;
  amountVariationPercent: number;
  source: string;
  autoCreateEligible: boolean;
  alreadyTracked: boolean;
  evidence: Array<{ amount: number; date: Date }>;
};

@Injectable()
export class BillsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBillDto) {
    return this.prisma.bill.create({
      data: {
        ownerType: (dto.ownerType as any) || 'user',
        userId: dto.ownerType === 'household' ? null : userId,
        householdId: dto.ownerType === 'household' ? dto.householdId : null,
        name: dto.name,
        category: (dto.category as any) || 'utilities',
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        recurring: dto.recurring ?? false,
        billingCycle: dto.billingCycle as any,
        provider: dto.provider,
        accountRef: dto.accountRef,
      },
    });
  }

  async findAll(userId: string, includePaid = false) {
    const householdIds = await this.prisma.householdMember
      .findMany({ where: { userId }, select: { householdId: true } })
      .then((m) => m.map((x) => x.householdId));

    const where: any = {
      OR: [
        { userId, ownerType: 'user' },
        { householdId: { in: householdIds }, ownerType: 'household' },
      ],
    };
    if (!includePaid) where.isPaid = false;

    return this.prisma.bill.findMany({ where, orderBy: { dueDate: 'asc' } });
  }

  async getUpcomingBills(userId: string, days = 30) {
    const householdIds = await this.prisma.householdMember
      .findMany({ where: { userId }, select: { householdId: true } })
      .then((m) => m.map((x) => x.householdId));
    const cutoff = addDays(new Date(), days);

    const bills = await this.prisma.bill.findMany({
      where: {
        OR: [
          { userId, ownerType: 'user' },
          { householdId: { in: householdIds }, ownerType: 'household' },
        ],
        isPaid: false,
        dueDate: { lte: cutoff },
      },
      orderBy: { dueDate: 'asc' },
    });

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        OR: [
          { userId, ownerType: 'user' },
          { householdId: { in: householdIds }, ownerType: 'household' },
        ],
        status: 'active',
        nextDueDate: { lte: cutoff },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    const totalBills = bills.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalSubscriptions = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0);

    return {
      bills,
      subscriptions,
      summary: {
        totalUpcoming: totalBills + totalSubscriptions,
        billsTotal: totalBills,
        subscriptionsTotal: totalSubscriptions,
        count: bills.length + subscriptions.length,
        nextDue: bills[0]?.dueDate || subscriptions[0]?.nextDueDate || null,
      },
    };
  }

  /**
   * Detect recurring debit patterns from the user's own transaction history.
   * Raw SMS text is never required here: detection works from structured ledger
   * transactions already accepted by Synced.
   */
  async discoverRecurring(userId: string, autoCreate = false) {
    const since = addDays(new Date(), -370);
    const rows = await this.prisma.transaction.findMany({
      where: { userId, type: 'debit', createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: {
        amount: true,
        category: true,
        description: true,
        merchant: true,
        source: true,
        createdAt: true,
      },
    });

    const grouped = new Map<string, any[]>();
    for (const row of rows) {
      const fingerprint = this.transactionFingerprint(row.merchant, row.description);
      if (!fingerprint) continue;
      const list = grouped.get(fingerprint) || [];
      list.push(row);
      grouped.set(fingerprint, list);
    }

    const candidates: RecurringCandidate[] = [];
    for (const [fingerprint, group] of grouped.entries()) {
      const candidate = await this.scoreRecurringGroup(userId, fingerprint, group);
      if (candidate && candidate.confidence >= 0.68) candidates.push(candidate);
    }

    candidates.sort((a, b) => b.confidence - a.confidence || a.nextDueDate.getTime() - b.nextDueDate.getTime());

    const created: any[] = [];
    if (autoCreate) {
      for (const candidate of candidates) {
        if (!candidate.autoCreateEligible || candidate.alreadyTracked || candidate.confidence < 0.86) continue;
        const bill = await this.prisma.bill.create({
          data: {
            ownerType: 'user',
            userId,
            householdId: null,
            name: candidate.name,
            category: candidate.category as any,
            amount: candidate.amount,
            dueDate: candidate.nextDueDate,
            recurring: true,
            billingCycle: candidate.billingCycle as any,
            provider: `${candidate.name} · inferred by Synced`,
            accountRef: `inferred:${candidate.fingerprint}`,
          },
        });
        candidate.alreadyTracked = true;
        created.push(bill);
      }
    }

    return {
      analysedTransactions: rows.length,
      suggestionThreshold: 0.68,
      autoCreateThreshold: 0.86,
      autoCreate,
      created,
      candidates: candidates.map((c) => ({
        fingerprint: c.fingerprint,
        name: c.name,
        category: c.category,
        amount: c.amount,
        billingCycle: c.billingCycle,
        nextDueDate: c.nextDueDate,
        occurrences: c.occurrences,
        confidence: c.confidence,
        cadenceDays: c.cadenceDays,
        amountVariationPercent: c.amountVariationPercent,
        source: c.source,
        autoCreateEligible: c.autoCreateEligible,
        alreadyTracked: c.alreadyTracked,
        inferred: true,
        evidence: c.evidence,
      })),
    };
  }

  async markPaid(id: string) {
    const current = await this.prisma.bill.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Bill not found');

    const paid = await this.prisma.bill.update({
      where: { id },
      data: { isPaid: true, paidAt: new Date() },
    });

    // A recurring bill is a series. Closing one occurrence should prepare the
    // next one so forecasts and reminders do not lose the obligation.
    if (current.recurring && current.billingCycle) {
      const nextDueDate = this.advanceDate(current.dueDate, current.billingCycle as any);
      const duplicate = await this.prisma.bill.findFirst({
        where: {
          userId: current.userId,
          householdId: current.householdId,
          isPaid: false,
          name: current.name,
          dueDate: nextDueDate,
        },
      });
      if (!duplicate) {
        await this.prisma.bill.create({
          data: {
            ownerType: current.ownerType,
            userId: current.userId,
            householdId: current.householdId,
            name: current.name,
            category: current.category,
            amount: current.amount,
            currency: current.currency,
            dueDate: nextDueDate,
            recurring: true,
            billingCycle: current.billingCycle,
            provider: current.provider,
            accountRef: current.accountRef,
          },
        });
      }
    }
    return paid;
  }

  async findById(id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  private async scoreRecurringGroup(userId: string, fingerprint: string, group: any[]): Promise<RecurringCandidate | null> {
    if (group.length < 3) return null;
    const dates = group.map((r) => new Date(r.createdAt));
    const intervals = dates.slice(1).map((date, i) => Math.max(1, differenceInCalendarDays(date, dates[i])));
    const medianInterval = this.median(intervals);
    const cadence = this.cadenceFor(medianInterval);
    if (!cadence) return null;

    const intervalError = intervals.reduce((sum, value) => sum + Math.abs(value - cadence.days), 0) / intervals.length;
    const cadenceScore = Math.max(0, 1 - intervalError / cadence.tolerance);

    const amounts = group.map((r) => Number(r.amount)).filter((v) => Number.isFinite(v) && v > 0);
    if (amounts.length < 3) return null;
    const medianAmount = this.median(amounts);
    const averageDeviation = amounts.reduce((sum, value) => sum + Math.abs(value - medianAmount), 0) / amounts.length;
    const variation = medianAmount > 0 ? averageDeviation / medianAmount : 1;
    const amountScore = Math.max(0, 1 - variation / 0.35);
    const sampleScore = Math.min(1, group.length / 5);
    const explicitMerchantScore = group.some((r) => String(r.merchant || '').trim().length >= 3) ? 1 : 0.55;
    const confidence = Math.round((cadenceScore * 0.45 + amountScore * 0.30 + sampleScore * 0.15 + explicitMerchantScore * 0.10) * 100) / 100;

    const latest = group[group.length - 1];
    const name = this.displayName(latest.merchant, latest.description);
    const category = this.mode(group.map((r) => String(r.category || 'other'))) || 'other';
    const source = this.mode(group.map((r) => String(r.source || 'manual'))) || 'manual';
    const nextDueDate = this.rollForward(dates[dates.length - 1], cadence.cycle);
    const autoCreateEligible = this.isBillLike(name, category);

    const existingBill = await this.prisma.bill.findFirst({
      where: {
        userId,
        isPaid: false,
        OR: [
          { accountRef: `inferred:${fingerprint}` },
          { name: { equals: name, mode: 'insensitive' }, recurring: true },
        ],
      },
    });
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active', name: { equals: name, mode: 'insensitive' } },
    });

    return {
      fingerprint,
      name,
      category,
      amount: Math.round(medianAmount),
      billingCycle: cadence.cycle,
      nextDueDate,
      occurrences: group.length,
      confidence,
      cadenceDays: Math.round(medianInterval),
      amountVariationPercent: Math.round(variation * 100),
      source,
      autoCreateEligible,
      alreadyTracked: Boolean(existingBill || existingSubscription),
      evidence: group.slice(-5).map((r) => ({ amount: Number(r.amount), date: new Date(r.createdAt) })),
    };
  }

  private transactionFingerprint(merchant?: string | null, description?: string | null): string | null {
    const original = String(merchant || description || '').trim().toLowerCase();
    if (!original) return null;
    const normalized = original
      .replace(/^(payment to|paid to|bill payment:?|sent to|purchase at|airtime for)\s+/i, '')
      .replace(/\b(?:ref|reference|txid|transaction)\s*[:#-]?\s*[a-z0-9-]+\b/gi, ' ')
      .replace(/\b\d{4,}\b/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, '-');
    if (normalized.length < 3) return null;
    if (/^(cash-withdrawal|withdrawal|bank-debit|debit-processed|transfer)$/.test(normalized)) return null;
    return normalized.slice(0, 96);
  }

  private displayName(merchant?: string | null, description?: string | null): string {
    const value = String(merchant || description || 'Recurring payment').trim();
    return value
      .replace(/^(payment to|paid to|bill payment:?|sent to)\s+/i, '')
      .replace(/\s+/g, ' ')
      .slice(0, 80);
  }

  private cadenceFor(days: number): { cycle: 'weekly' | 'monthly' | 'quarterly' | 'annually'; days: number; tolerance: number } | null {
    if (days >= 5 && days <= 10) return { cycle: 'weekly', days: 7, tolerance: 4 };
    if (days >= 24 && days <= 38) return { cycle: 'monthly', days: 30, tolerance: 12 };
    if (days >= 75 && days <= 105) return { cycle: 'quarterly', days: 91, tolerance: 25 };
    if (days >= 330 && days <= 395) return { cycle: 'annually', days: 365, tolerance: 50 };
    return null;
  }

  private isBillLike(name: string, category: string): boolean {
    const categories = new Set(['utilities', 'subscriptions', 'rent', 'school_fees', 'healthcare', 'mobile_data', 'bill_payment', 'other']);
    const words = /(nwsc|water|umeme|yaka|electric|power|rent|school|tuition|internet|wifi|data|dstv|gotv|netflix|showmax|spotify|insurance|loan|mortgage|subscription|bill)/i;
    return categories.has(category) || words.test(name);
  }

  private rollForward(last: Date, cycle: 'weekly' | 'monthly' | 'quarterly' | 'annually'): Date {
    let next = this.advanceDate(last, cycle);
    const now = new Date();
    while (next <= now) next = this.advanceDate(next, cycle);
    return next;
  }

  private advanceDate(date: Date, cycle: 'weekly' | 'monthly' | 'quarterly' | 'annually'): Date {
    if (cycle === 'weekly') return addWeeks(date, 1);
    if (cycle === 'quarterly') return addQuarters(date, 1);
    if (cycle === 'annually') return addYears(date, 1);
    return addMonths(date, 1);
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  private mode(values: string[]): string | null {
    const counts = new Map<string, number>();
    values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }
}
