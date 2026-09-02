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
});


describe('IngestionService confirmed SMS movement rules', () => {
  it('rejects prompts and reminders even when they contain transaction-like amounts', () => {
    const service = new IngestionService({} as any, {} as any, {} as any);
    expect(service.parseSms('Payment request: UGX 25,000. Enter your PIN to approve this payment.')).toBeNull();
    expect(service.parseSms('Bill reminder: UGX 40,000 is due tomorrow and your account will be debited.')).toBeNull();
  });

  it('still accepts confirmed received money', () => {
    const service = new IngestionService({} as any, {} as any, {} as any);
    const parsed = service.parseSms('You have received UGX 10,000 from Jane Doe.');
    expect(parsed?.type).toBe('credit');
    expect(parsed?.amount).toBe(10000);
  });
});
