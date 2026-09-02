import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  subDays,
} from 'date-fns';

type Cycle = 'weekly' | 'monthly' | 'quarterly' | 'annually';

type RecurringTx = {
  amount: number;
  category: string;
  merchant?: string | null;
  description?: string | null;
  createdAt: Date;
};

export type RecurringPatternInsight = {
  patternKey: string;
  name: string;
  provider: string | null;
  category: string;
  expectedAmount: number;
  occurrences: number;
  billingCycle: Cycle;
  confidence: number;
  cadenceScore: number;
  amountStability: number;
  lastSeen: Date;
  nextDue: Date;
  autoCreateEligible: boolean;
  autoCreated: boolean;
  linkedBillId: string | null;
  evidence: string;
};

const BILL_LIKE_CATEGORIES = new Set([
  'utilities',
  'subscriptions',
  'rent',
  'school_fees',
  'mobile_data',
  'bill_payment',
]);

const BILL_KEYWORDS = [
  'nwsc', 'umeme', 'electric', 'water', 'rent', 'school', 'tuition', 'insurance',
  'internet', 'wifi', 'fibre', 'fiber', 'dstv', 'gotv', 'netflix', 'spotify',
  'youtube', 'google', 'apple', 'airtel', 'mtn', 'subscription', 'monthly fee',
];

const GENERIC_KEYS = new Set([
  'bank debit', 'debit processed', 'cash withdrawal', 'money sent', 'payment',
  'paid', 'transfer', 'airtime purchase', 'cash deposit',
]);

const CYCLES: Array<{ cycle: Cycle; days: number; tolerance: number }> = [
  { cycle: 'weekly', days: 7, tolerance: 3 },
  { cycle: 'monthly', days: 30, tolerance: 9 },
  { cycle: 'quarterly', days: 91, tolerance: 22 },
  { cycle: 'annually', days: 365, tolerance: 55 },
];

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function recurringPatternKey(tx: Pick<RecurringTx, 'merchant' | 'description'>): string | null {
  const raw = (tx.merchant || tx.description || '')
    .toLowerCase()
    .replace(/^(payment|bill payment|money sent|paid|sent)\s+(to|for)\s+/i, '')
    .replace(/\b(?:tx|txn|transaction|ref|reference|account|acct|a\/c)\s*[:#-]?\s*[a-z0-9-]+\b/gi, ' ')
    .replace(/\b\d{4,}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (raw.length < 3 || GENERIC_KEYS.has(raw) || /^\d+$/.test(raw)) return null;
  return raw.slice(0, 80);
}

export function inferRecurringPattern(rows: RecurringTx[]): Omit<RecurringPatternInsight, 'autoCreated' | 'linkedBillId'> | null {
  if (rows.length < 2) return null;

  const byDay = new Map<string, RecurringTx>();
  [...rows]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .forEach((row) => byDay.set(row.createdAt.toISOString().slice(0, 10), row));
  const ordered = [...byDay.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (ordered.length < 2) return null;

  const intervals = ordered.slice(1).map((row, index) =>
    differenceInCalendarDays(row.createdAt, ordered[index].createdAt),
  );
  const intervalMedian = median(intervals);
  const cycle = CYCLES
    .map((candidate) => ({
      ...candidate,
      error: Math.abs(intervalMedian - candidate.days),
    }))
    .filter((candidate) => candidate.error <= candidate.tolerance)
    .sort((a, b) => a.error - b.error)[0];
  if (!cycle) return null;

  const minimumOccurrences = cycle.cycle === 'annually' ? 2 : 3;
  if (ordered.length < minimumOccurrences) return null;

  const cadenceError = intervals.reduce((sum, days) => sum + Math.abs(days - cycle.days), 0) / intervals.length;
  const cadenceScore = Math.max(0, Math.min(1, 1 - cadenceError / cycle.tolerance));
  if (cadenceScore < 0.45) return null;

  const amounts = ordered.map((row) => Number(row.amount)).filter((amount) => amount > 0);
  const expectedAmount = median(amounts);
  if (!expectedAmount) return null;
  const amountDeviation = median(amounts.map((amount) => Math.abs(amount - expectedAmount))) / expectedAmount;
  const amountStability = Math.max(0, Math.min(1, 1 - amountDeviation / 0.45));

  const categoryCounts = ordered.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + 1;
    return acc;
  }, {});
  const category = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';
  const latest = ordered[ordered.length - 1];
  const key = recurringPatternKey(latest);
  if (!key) return null;

  const provider = latest.merchant?.trim() || null;
  const billSignal = BILL_LIKE_CATEGORIES.has(category) || BILL_KEYWORDS.some((word) => `${key} ${provider || ''}`.includes(word));
  const occurrenceScore = Math.min(1, ordered.length / 4);
  const confidence = Math.max(0, Math.min(0.99,
    cadenceScore * 0.45 + amountStability * 0.25 + occurrenceScore * 0.15 + (billSignal ? 0.15 : 0),
  ));

  const nextDue = addCycle(latest.createdAt, cycle.cycle);
  const staleDays = differenceInCalendarDays(new Date(), latest.createdAt);
  const stale = staleDays > cycle.days * 2.2;
  const autoCreateEligible = !stale && billSignal && ordered.length >= 3 && confidence >= 0.84;
  const displayName = provider || titleCase(key);

  return {
    patternKey: key,
    name: displayName,
    provider,
    category,
    expectedAmount: Math.round(expectedAmount),
    occurrences: ordered.length,
    billingCycle: cycle.cycle,
    confidence: Number(confidence.toFixed(2)),
    cadenceScore: Number(cadenceScore.toFixed(2)),
    amountStability: Number(amountStability.toFixed(2)),
    lastSeen: latest.createdAt,
    nextDue,
    autoCreateEligible,
    evidence: `${ordered.length} similar payments; ${cycle.cycle} cadence; ${Math.round(amountStability * 100)}% amount stability`,
  };
}

function addCycle(date: Date, cycle: Cycle): Date {
  switch (cycle) {
    case 'weekly': return addWeeks(date, 1);
    case 'quarterly': return addQuarters(date, 1);
    case 'annually': return addYears(date, 1);
    default: return addMonths(date, 1);
  }
}

@Injectable()
export class RecurringDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  async detect(userId: string, autoCreate = true) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { patterns: [], autoCreated: 0 };

    const transactions = await this.prisma.transaction.findMany({
      where: {
        walletId: wallet.id,
        userId,
        type: 'debit',
        createdAt: { gte: subDays(new Date(), 800) },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        amount: true,
        category: true,
        merchant: true,
        description: true,
        createdAt: true,
      },
    });

    const groups = new Map<string, RecurringTx[]>();
    for (const row of transactions) {
      const normalized: RecurringTx = {
        amount: Number(row.amount),
        category: row.category as string,
        merchant: row.merchant,
        description: row.description,
        createdAt: row.createdAt,
      };
      const key = recurringPatternKey(normalized);
      if (!key) continue;
      groups.set(key, [...(groups.get(key) || []), normalized]);
    }

    const patterns: RecurringPatternInsight[] = [];
    let autoCreated = 0;

    for (const rows of groups.values()) {
      const inferred = inferRecurringPattern(rows);
      if (!inferred || inferred.confidence < 0.62) continue;

      const recurrenceRef = `synced:recurrence:${inferred.patternKey.replace(/\s+/g, '-')}`;
      let linkedBill = await this.prisma.bill.findFirst({
        where: {
          userId,
          ownerType: 'user',
          recurring: true,
          isPaid: false,
          OR: [
            { accountRef: recurrenceRef },
            ...(inferred.provider ? [{ provider: { equals: inferred.provider, mode: 'insensitive' as const } }] : []),
            { name: { equals: inferred.name, mode: 'insensitive' as const } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      let created = false;
      if (!linkedBill && autoCreate && inferred.autoCreateEligible) {
        linkedBill = await this.prisma.bill.create({
          data: {
            ownerType: 'user',
            userId,
            name: inferred.name,
            category: inferred.category as any,
            amount: inferred.expectedAmount,
            dueDate: inferred.nextDue,
            recurring: true,
            billingCycle: inferred.billingCycle as any,
            provider: inferred.provider || inferred.name,
            accountRef: recurrenceRef,
          },
        });
        autoCreated += 1;
        created = true;
      } else if (linkedBill?.accountRef === recurrenceRef && inferred.nextDue > linkedBill.dueDate && inferred.lastSeen >= addDays(linkedBill.dueDate, -10)) {
        linkedBill = await this.prisma.bill.update({
          where: { id: linkedBill.id },
          data: {
            amount: inferred.expectedAmount,
            dueDate: inferred.nextDue,
            category: inferred.category as any,
          },
        });
      }

      patterns.push({
        ...inferred,
        autoCreated: created,
        linkedBillId: linkedBill?.id || null,
      });
    }

    return {
      patterns: patterns.sort((a, b) => b.confidence - a.confidence),
      autoCreated,
    };
  }
}
