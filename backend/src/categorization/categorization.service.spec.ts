import { CategorizationService } from './categorization.service';

describe('CategorizationService SMS semantics', () => {
  const service = new CategorizationService();

  it('categorizes salary income', () => {
    expect(service.categorize('Salary income received from employer')).toBe('salary');
  });

  it('keeps refunds separate from spending', () => {
    expect(service.categorize('Refund or reversal received from merchant')).toBe('transfer');
  });

  it('recognizes business and freelance inflows', () => {
    expect(service.categorize('Business income received from customer')).toBe('transfer');
    expect(service.categorize('Freelance or consulting income received from client')).toBe('transfer');
  });

  it('categorizes common household bill types', () => {
    expect(service.categorize('Water bill payment to NWSC')).toBe('utilities');
    expect(service.categorize('Electricity bill payment to UEDCL')).toBe('utilities');
    expect(service.categorize('Subscription bill payment to DStv')).toBe('subscriptions');
    expect(service.categorize('School or tuition fee payment to school')).toBe('school_fees');
  });

  it('routes financial obligations to bill payment', () => {
    expect(service.categorize('Loan repayment to lender')).toBe('bill_payment');
    expect(service.categorize('Insurance premium payment to insurer')).toBe('bill_payment');
    expect(service.categorize('Tax or statutory fee payment to URA')).toBe('bill_payment');
  });

  it('uses transfer only after more specific rules', () => {
    expect(service.categorize('Salary income received from MTN MoMo')).toBe('salary');
    expect(service.categorize('Money received from Jane Doe')).toBe('transfer');
  });
});
