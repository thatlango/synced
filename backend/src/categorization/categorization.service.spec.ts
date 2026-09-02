import { CategorizationService } from './categorization.service';

describe('CategorizationService SMS semantics', () => {
  const service = new CategorizationService();

  it('categorizes salary income', () => {
    expect(service.categorize('Salary income received from employer')).toBe('salary');
  });

  it('does not treat salary advance repayment as salary', () => {
    expect(service.categorize('Salary advance repayment to lender')).toBe('bill_payment');
  });

  it('keeps refunds separate from spending', () => {
    expect(service.categorize('Refund or reversal received from merchant')).toBe('transfer');
  });

  it('recognizes business and freelance inflows', () => {
    expect(service.categorize('Business income received from customer')).toBe('transfer');
    expect(service.categorize('Freelance or consulting income received from client')).toBe('transfer');
  });

  it('treats borrowing and repayments received as transfers, not income or expenses', () => {
    expect(service.categorize('Loan disbursement received from SACCO')).toBe('transfer');
    expect(service.categorize('Loan repayment received from borrower')).toBe('transfer');
    expect(service.categorize('Debt repayment received from debtor')).toBe('transfer');
  });

  it('categorizes common household bill types', () => {
    expect(service.categorize('Water bill payment to NWSC')).toBe('utilities');
    expect(service.categorize('Electricity bill payment to UEDCL')).toBe('utilities');
    expect(service.categorize('Subscription bill payment to DStv')).toBe('subscriptions');
    expect(service.categorize('School or tuition fee payment to school')).toBe('school_fees');
  });

  it('routes loan servicing components to bill payment', () => {
    expect(service.categorize('Loan repayment to lender')).toBe('bill_payment');
    expect(service.categorize('Loan interest payment to lender')).toBe('bill_payment');
    expect(service.categorize('Loan fee payment to lender')).toBe('bill_payment');
    expect(service.categorize('Loan penalty payment to lender')).toBe('bill_payment');
    expect(service.categorize('Overdraft repayment to bank')).toBe('bill_payment');
  });

  it('routes debt and card repayments to bill payment', () => {
    expect(service.categorize('Debt repayment to creditor')).toBe('bill_payment');
    expect(service.categorize('Credit card payment to bank')).toBe('bill_payment');
    expect(service.categorize('Arrears payment to lender')).toBe('bill_payment');
    expect(service.categorize('BNPL repayment to provider')).toBe('bill_payment');
  });

  it('routes other financial obligations to bill payment', () => {
    expect(service.categorize('Insurance premium payment to insurer')).toBe('bill_payment');
    expect(service.categorize('Tax or statutory fee payment to URA')).toBe('bill_payment');
  });

  it('uses transfer only after more specific rules', () => {
    expect(service.categorize('Salary income received from MTN MoMo')).toBe('salary');
    expect(service.categorize('Money received from Jane Doe')).toBe('transfer');
  });
});
