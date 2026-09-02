import { IngestionService } from './ingestion.service';

describe('IngestionService structured SMS bulk contract', () => {
  it('returns the Android-compatible processed count and duplicate/skipped totals', async () => {
    const service = new IngestionService({} as any, {} as any, {} as any);
    const ingestCandidate = jest.spyOn(service as any, 'ingestCandidate');
    ingestCandidate
      .mockResolvedValueOnce({ accepted: true, duplicate: false, transaction: { id: 'tx-1' } })
      .mockResolvedValueOnce({ accepted: false, duplicate: true, transaction: null })
      .mockRejectedValueOnce(new Error('invalid candidate'));

    const result = await service.ingestCandidateBulk('user-1', 'wallet-1', [
      { amount: 5000, type: 'debit', description: 'Merchant payment', source: 'mtn' },
      { amount: 5000, type: 'debit', description: 'Merchant payment', source: 'mtn' },
      { amount: 0, type: 'debit', description: 'Invalid', source: 'sms' },
    ]);

    expect(result.total).toBe(3);
    expect(result.processed).toBe(1);
    expect(result.ingested).toBe(1);
    expect(result.duplicates).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.results).toHaveLength(3);
  });

  it('persists structured loan repayment metadata without raw SMS text', async () => {
    const categorization = {
      categorize: jest.fn().mockReturnValue('bill_payment'),
    };
    const transactions = {
      create: jest.fn().mockResolvedValue({ id: 'loan-tx-1' }),
    };
    const service = new IngestionService({} as any, categorization as any, transactions as any);

    await service.ingestCandidate('user-1', 'wallet-1', {
      amount: 100000,
      type: 'debit',
      description: 'Loan repayment to Pride Microfinance',
      merchant: 'Pride Microfinance',
      source: 'sms',
      referenceId: 'local-one-way-fingerprint',
      confidence: 0.98,
      financialKind: 'loan',
      financialSubtype: 'loan_repayment',
      counterparty: 'Pride Microfinance',
      principalAmount: 80000,
      interestAmount: 20000,
      outstandingBalance: 900000,
    });

    expect(transactions.create).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        walletId: 'wallet-1',
        type: 'debit',
        amount: 100000,
        category: 'bill_payment',
        metadata: {
          classificationSource: 'sms_local_parser',
          financialKind: 'loan',
          financialSubtype: 'loan_repayment',
          counterparty: 'Pride Microfinance',
          principalAmount: 80000,
          interestAmount: 20000,
          outstandingBalance: 900000,
          classificationConfidence: 0.98,
        },
      }),
    );

    const savedDto = transactions.create.mock.calls[0][1];
    expect(JSON.stringify(savedDto)).not.toContain('rawSms');
    expect(JSON.stringify(savedDto)).not.toContain('smsBody');
  });

  it('persists loan disbursement as transfer semantics rather than salary', async () => {
    const categorization = {
      categorize: jest.fn().mockReturnValue('transfer'),
    };
    const transactions = {
      create: jest.fn().mockResolvedValue({ id: 'loan-tx-2' }),
    };
    const service = new IngestionService({} as any, categorization as any, transactions as any);

    await service.ingestCandidate('user-1', 'wallet-1', {
      amount: 1000000,
      type: 'credit',
      description: 'Loan disbursement received from Village SACCO',
      source: 'sms',
      confidence: 0.98,
      financialKind: 'loan',
      financialSubtype: 'loan_disbursement',
      counterparty: 'Village SACCO',
      outstandingBalance: 1100000,
    });

    expect(categorization.categorize).toHaveBeenCalledWith(
      'Loan disbursement received from Village SACCO',
      undefined,
    );
    expect(transactions.create).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        type: 'credit',
        category: 'transfer',
        metadata: expect.objectContaining({
          financialKind: 'loan',
          financialSubtype: 'loan_disbursement',
          outstandingBalance: 1100000,
        }),
      }),
    );
  });
});
