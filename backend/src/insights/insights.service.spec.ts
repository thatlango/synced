import { addDays, subDays } from 'date-fns';
import { InsightsService } from './insights.service';

describe('InsightsService obligation-aware summary', () => {
  it('prioritises overdue and near-term obligations over generic spending commentary', async () => {
    const service = new InsightsService({} as any, {} as any);
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
    } as any);

    const result = await service.summary('user-1');

    expect(result.nextBill?.name).toBe('Electricity');
    expect(result.obligationSummary.totalDueNext30Days).toBe(130_000);
    expect(result.obligationSummary.shortfall).toBe(30_000);
    expect(result.deterministicInsight).toContain('Electricity');
    expect(result.deterministicInsight).toContain('overdue');
    expect(result.deterministicInsight).toContain('UGX 30,000');
  });

  it('falls back to spending analysis when there are no known obligations', async () => {
    const service = new InsightsService({} as any, {} as any);
    jest.spyOn(service, 'financialContext').mockResolvedValue({
      currency: 'UGX',
      balance: 500_000,
      monthSpend: 330_000,
      monthIncome: 400_000,
      priorThreeMonthSpend: 600_000,
      upcomingObligations: [],
    } as any);

    const result = await service.summary('user-1');

    expect(result.nextBill).toBeNull();
    expect(result.obligationSummary.count).toBe(0);
    expect(result.deterministicInsight).toContain('above your recent monthly average');
  });
});
