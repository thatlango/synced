import { addDays, subDays } from 'date-fns';
import { InsightsService } from './insights.service';

describe('InsightsService obligation-aware summary', () => {
  const createService = () => new InsightsService({} as any, {} as any, {} as any);

  it('prioritises overdue and near-term obligations over generic spending commentary', async () => {
    const service = createService();
    jest.spyOn(service, 'financialContext').mockResolvedValue({
      currency: 'UGX',
      balance: 100_000,
      monthSpend: 200_000,
      monthIncome: 300_000,
      priorThreeMonthSpend: 600_000,
      upcomingObligations: [
        {
          type: 'bill',
          name: 'Electricity',
          category: 'utilities',
          amount: 80_000,
          dueDate: subDays(new Date(), 2),
          recurring: true,
        },
        {
          type: 'subscription',
          name: 'Internet',
          category: 'subscriptions',
          amount: 50_000,
          dueDate: addDays(new Date(), 5),
          recurring: true,
        },
      ],
      detectedRecurringPatterns: [],
    } as any);

    const result = await service.summary('user-1');

    expect(result.nextBill?.name).toBe('Electricity');
    expect(result.obligationSummary.totalDueNext30Days).toBe(130_000);
    expect(result.obligationSummary.shortfall).toBe(30_000);
    expect(result.deterministicInsight).toContain('Electricity');
    expect(result.deterministicInsight).toContain('overdue');
    expect(result.deterministicInsight).toContain('UGX 30,000');
  });

  it('surfaces a recurring-payment suggestion when no tracked obligation is due', async () => {
    const service = createService();
    jest.spyOn(service, 'financialContext').mockResolvedValue({
      currency: 'UGX',
      balance: 500_000,
      monthSpend: 200_000,
      monthIncome: 400_000,
      priorThreeMonthSpend: 600_000,
      upcomingObligations: [],
      detectedRecurringPatterns: [
        {
          name: 'NWSC',
          billingCycle: 'monthly',
          expectedAmount: 45_000,
          confidence: 0.81,
          linkedBillId: null,
        },
      ],
    } as any);

    const result = await service.summary('user-1');

    expect(result.nextBill).toBeNull();
    expect(result.recurrenceInsight).toContain('NWSC');
    expect(result.recurrenceInsight).toContain('81% confidence');
    expect(result.deterministicInsight).toContain('possible monthly NWSC payment');
  });

  it('falls back to spending analysis when there are no known or inferred obligations', async () => {
    const service = createService();
    jest.spyOn(service, 'financialContext').mockResolvedValue({
      currency: 'UGX',
      balance: 500_000,
      monthSpend: 330_000,
      monthIncome: 400_000,
      priorThreeMonthSpend: 600_000,
      upcomingObligations: [],
      detectedRecurringPatterns: [],
    } as any);

    const result = await service.summary('user-1');

    expect(result.nextBill).toBeNull();
    expect(result.obligationSummary.count).toBe(0);
    expect(result.deterministicInsight).toContain('above your recent monthly average');
  });
});
