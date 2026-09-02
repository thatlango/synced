import { BillsService } from './bills.service';

describe('BillsService recurring intelligence', () => {
  const prisma = {
    transaction: { findMany: jest.fn() },
    bill: { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    subscription: { findFirst: jest.fn(), findMany: jest.fn() },
    householdMember: { findMany: jest.fn() },
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('detects a stable monthly utility pattern and auto-creates a high-confidence inferred bill', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      { amount: 82000, category: 'utilities', description: 'Bill payment: NWSC-00312', merchant: 'NWSC-00312', source: 'mtn', createdAt: new Date('2026-05-04T08:00:00Z') },
      { amount: 81000, category: 'utilities', description: 'Bill payment: NWSC-00312', merchant: 'NWSC-00312', source: 'mtn', createdAt: new Date('2026-06-04T08:00:00Z') },
      { amount: 83000, category: 'utilities', description: 'Bill payment: NWSC-00312', merchant: 'NWSC-00312', source: 'mtn', createdAt: new Date('2026-07-04T08:00:00Z') },
      { amount: 82000, category: 'utilities', description: 'Bill payment: NWSC-00312', merchant: 'NWSC-00312', source: 'mtn', createdAt: new Date('2026-08-04T08:00:00Z') },
    ]);
    prisma.bill.findFirst.mockResolvedValue(null);
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.bill.create.mockImplementation(async ({ data }: any) => ({ id: 'bill-1', ...data }));

    const service = new BillsService(prisma);
    const result = await service.discoverRecurring('user-1', true);

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].billingCycle).toBe('monthly');
    expect(result.candidates[0].confidence).toBeGreaterThanOrEqual(0.86);
    expect(result.candidates[0].autoCreateEligible).toBe(true);
    expect(result.created).toHaveLength(1);
    expect(prisma.bill.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-1',
        recurring: true,
        billingCycle: 'monthly',
        category: 'utilities',
        accountRef: expect.stringMatching(/^inferred:/),
      }),
    }));
  });

  it('can suggest a recurring discretionary merchant without silently auto-creating it as a bill', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      { amount: 25000, category: 'food', description: 'Payment to Cafe', merchant: 'Cafe', source: 'mtn', createdAt: new Date('2026-08-01T08:00:00Z') },
      { amount: 25000, category: 'food', description: 'Payment to Cafe', merchant: 'Cafe', source: 'mtn', createdAt: new Date('2026-08-08T08:00:00Z') },
      { amount: 25000, category: 'food', description: 'Payment to Cafe', merchant: 'Cafe', source: 'mtn', createdAt: new Date('2026-08-15T08:00:00Z') },
      { amount: 25000, category: 'food', description: 'Payment to Cafe', merchant: 'Cafe', source: 'mtn', createdAt: new Date('2026-08-22T08:00:00Z') },
    ]);
    prisma.bill.findFirst.mockResolvedValue(null);
    prisma.subscription.findFirst.mockResolvedValue(null);

    const service = new BillsService(prisma);
    const result = await service.discoverRecurring('user-1', true);

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].autoCreateEligible).toBe(false);
    expect(result.created).toHaveLength(0);
    expect(prisma.bill.create).not.toHaveBeenCalled();
  });

  it('rolls a recurring bill forward when the current occurrence is marked paid', async () => {
    const current = {
      id: 'bill-1', ownerType: 'user', userId: 'user-1', householdId: null,
      name: 'Internet', category: 'utilities', amount: 120000, currency: 'UGX',
      dueDate: new Date('2026-09-05T00:00:00Z'), recurring: true, billingCycle: 'monthly',
      provider: 'ISP', accountRef: 'acct-1',
    };
    prisma.bill.findUnique.mockResolvedValue(current);
    prisma.bill.update.mockResolvedValue({ ...current, isPaid: true });
    prisma.bill.findFirst.mockResolvedValue(null);
    prisma.bill.create.mockResolvedValue({ id: 'bill-2' });

    const service = new BillsService(prisma);
    await service.markPaid('bill-1');

    expect(prisma.bill.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: 'Internet',
        recurring: true,
        billingCycle: 'monthly',
        dueDate: new Date('2026-10-05T00:00:00Z'),
      }),
    }));
  });
});
