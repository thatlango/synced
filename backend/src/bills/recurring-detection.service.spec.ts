import { inferRecurringPattern, recurringPatternKey } from './recurring-detection.service';

describe('RecurringDetectionService inference', () => {
  it('recognises a stable monthly utility payment as auto-create eligible', () => {
    const rows = [
      ['2026-05-03T08:00:00Z', 42000],
      ['2026-06-02T08:00:00Z', 44000],
      ['2026-07-03T08:00:00Z', 43000],
      ['2026-08-02T08:00:00Z', 45000],
    ].map(([createdAt, amount]) => ({
      amount: Number(amount),
      category: 'utilities',
      merchant: 'NWSC-00312',
      description: 'Bill payment: NWSC-00312',
      createdAt: new Date(String(createdAt)),
    }));

    const pattern = inferRecurringPattern(rows);
    expect(pattern).not.toBeNull();
    expect(pattern?.billingCycle).toBe('monthly');
    expect(pattern?.expectedAmount).toBeGreaterThanOrEqual(42000);
    expect(pattern?.confidence).toBeGreaterThanOrEqual(0.84);
    expect(pattern?.autoCreateEligible).toBe(true);
  });

  it('does not convert irregular repeat restaurant spending into a bill', () => {
    const rows = [
      ['2026-06-01T08:00:00Z', 18000],
      ['2026-06-09T08:00:00Z', 42000],
      ['2026-07-22T08:00:00Z', 12000],
      ['2026-08-02T08:00:00Z', 55000],
    ].map(([createdAt, amount]) => ({
      amount: Number(amount),
      category: 'food',
      merchant: 'Cafe Javas',
      description: 'Payment to Cafe Javas',
      createdAt: new Date(String(createdAt)),
    }));

    const pattern = inferRecurringPattern(rows);
    expect(pattern?.autoCreateEligible ?? false).toBe(false);
  });

  it('normalises provider references into the same pattern key', () => {
    expect(recurringPatternKey({ merchant: 'NWSC-00312', description: 'Payment to NWSC-00312' })).toBe('nwsc');
  });
});
