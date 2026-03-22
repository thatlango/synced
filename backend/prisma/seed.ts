import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Synced demo database...');

  // ─── Clean existing data ──────────────────────────────────────
  await prisma.reconciliationLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.householdMember.deleteMany();
  await prisma.household.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create Demo Users ────────────────────────────────────────
  const john = await prisma.user.create({
    data: {
      phone: '+256700000001',
      email: 'john@synced.app',
      name: 'John Mukasa',
      platform: 'android',
      isVerified: true,
      lastLogin: new Date(),
    },
  });

  const sarah = await prisma.user.create({
    data: {
      phone: '+256700000002',
      email: 'sarah@synced.app',
      name: 'Sarah Namukasa',
      platform: 'ios',
      isVerified: true,
      lastLogin: new Date(),
    },
  });

  const david = await prisma.user.create({
    data: {
      phone: '+256700000003',
      email: 'david@synced.app',
      name: 'David Ochieng',
      platform: 'android',
      isVerified: true,
      lastLogin: new Date(),
    },
  });

  console.log('✅ Users created: John, Sarah, David');

  // ─── Create Personal Wallets ──────────────────────────────────
  const johnWallet = await prisma.wallet.create({
    data: { type: 'personal', userId: john.id, balance: 850000 },
  });
  const sarahWallet = await prisma.wallet.create({
    data: { type: 'personal', userId: sarah.id, balance: 1200000 },
  });
  const davidWallet = await prisma.wallet.create({
    data: { type: 'personal', userId: david.id, balance: 620000 },
  });

  console.log('✅ Personal wallets created');

  // ─── Create Household ─────────────────────────────────────────
  const household = await prisma.household.create({
    data: {
      name: 'Nakawa Family Home',
      createdBy: john.id,
      inviteCode: 'NAKAWA2024',
      members: {
        create: [
          { userId: john.id, role: 'admin' },
          { userId: sarah.id, role: 'member' },
          { userId: david.id, role: 'member' },
        ],
      },
    },
  });

  const householdWallet = await prisma.wallet.create({
    data: { type: 'household', householdId: household.id, balance: 2500000 },
  });

  console.log('✅ Household "Nakawa Family Home" created with 3 members');

  // ─── Personal Transactions - John ─────────────────────────────
  const johnTransactions = [
    { type: 'credit', amount: 3500000, category: 'salary', description: 'Monthly salary', source: 'mtn', daysAgo: 30 },
    { type: 'debit', amount: 850000, category: 'rent', description: 'Apartment rent - March', source: 'manual', daysAgo: 28 },
    { type: 'debit', amount: 45000, category: 'food', description: 'Lunch at Cafe Javas', merchant: 'Cafe Javas', source: 'mtn', daysAgo: 25 },
    { type: 'debit', amount: 120000, category: 'food', description: 'Weekly grocery shopping', merchant: 'Shoprite', source: 'mtn', daysAgo: 22 },
    { type: 'debit', amount: 35000, category: 'transport', description: 'SafeBoda rides', merchant: 'SafeBoda', source: 'airtel', daysAgo: 20 },
    { type: 'debit', amount: 25000, category: 'entertainment', description: 'Netflix subscription', merchant: 'Netflix', source: 'mtn', daysAgo: 18 },
    { type: 'debit', amount: 8000, category: 'mobile_data', description: 'MTN data bundle', merchant: 'MTN', source: 'mtn', daysAgo: 15 },
    { type: 'debit', amount: 55000, category: 'healthcare', description: 'Pharmacy - Nsambya', merchant: 'Nsambya Hospital', source: 'manual', daysAgo: 12 },
    { type: 'debit', amount: 30000, category: 'food', description: 'Dinner with colleagues', source: 'mtn', daysAgo: 10 },
    { type: 'credit', amount: 150000, description: 'Freelance payment', category: 'salary', source: 'airtel', daysAgo: 8 },
    { type: 'debit', amount: 22000, category: 'fuel', description: 'Fuel top-up', merchant: 'Total', source: 'mtn', daysAgo: 5 },
    { type: 'debit', amount: 18000, category: 'food', description: 'Breakfast - Rolex', daysAgo: 3, source: 'manual' },
    { type: 'debit', amount: 85000, category: 'shopping', description: 'Clothes - Owino Market', daysAgo: 2, source: 'manual' },
  ];

  let johnBalance = 3500000;
  for (const tx of johnTransactions) {
    const balanceBefore = johnBalance;
    johnBalance = tx.type === 'credit' ? johnBalance + tx.amount : johnBalance - tx.amount;
    const transaction = await prisma.transaction.create({
      data: {
        walletId: johnWallet.id,
        userId: john.id,
        type: tx.type as any,
        amount: tx.amount,
        category: tx.category as any,
        description: tx.description,
        merchant: (tx as any).merchant,
        source: tx.source as any,
        visibility: 'personal',
        createdAt: subDays(new Date(), tx.daysAgo),
      },
    });
    await prisma.ledgerEntry.create({
      data: {
        walletId: johnWallet.id,
        userId: john.id,
        transactionId: transaction.id,
        type: tx.type as any,
        amount: tx.amount,
        balanceBefore,
        balanceAfter: johnBalance,
        category: tx.category as any,
        source: tx.source as any,
        visibility: 'personal',
        description: tx.description,
        createdAt: subDays(new Date(), tx.daysAgo),
      },
    });
  }
  await prisma.wallet.update({ where: { id: johnWallet.id }, data: { balance: Math.max(0, johnBalance) } });

  // ─── Personal Transactions - Sarah ───────────────────────────
  const sarahTransactions = [
    { type: 'credit', amount: 4200000, category: 'salary', description: 'Monthly salary', source: 'airtel', daysAgo: 30 },
    { type: 'debit', amount: 200000, category: 'school_fees', description: 'Kids school fees', source: 'manual', daysAgo: 27 },
    { type: 'debit', amount: 95000, category: 'food', description: 'Grocery shopping - Carrefour', merchant: 'Carrefour', source: 'airtel', daysAgo: 24 },
    { type: 'debit', amount: 45000, category: 'entertainment', description: 'DSTV Subscription', merchant: 'DSTV', source: 'airtel', daysAgo: 21 },
    { type: 'debit', amount: 60000, category: 'healthcare', description: 'Routine checkup', source: 'manual', daysAgo: 17 },
    { type: 'debit', amount: 35000, category: 'transport', description: 'Uber rides', merchant: 'Uber', source: 'airtel', daysAgo: 14 },
    { type: 'debit', amount: 150000, category: 'shopping', description: 'Kids clothes - Game', merchant: 'Game', source: 'airtel', daysAgo: 10 },
    { type: 'debit', amount: 42000, category: 'food', description: 'Restaurant dinner', source: 'mtn', daysAgo: 7 },
    { type: 'debit', amount: 12000, category: 'mobile_data', description: 'Airtel bundle', source: 'airtel', daysAgo: 5 },
    { type: 'debit', amount: 28000, category: 'food', description: 'Lunch - work', daysAgo: 2, source: 'manual' },
  ];

  let sarahBalance = 4200000;
  for (const tx of sarahTransactions) {
    const balanceBefore = sarahBalance;
    sarahBalance = tx.type === 'credit' ? sarahBalance + tx.amount : sarahBalance - tx.amount;
    const transaction = await prisma.transaction.create({
      data: {
        walletId: sarahWallet.id,
        userId: sarah.id,
        type: tx.type as any,
        amount: tx.amount,
        category: tx.category as any,
        description: tx.description,
        merchant: (tx as any).merchant,
        source: tx.source as any,
        visibility: 'personal',
        createdAt: subDays(new Date(), tx.daysAgo),
      },
    });
    await prisma.ledgerEntry.create({
      data: {
        walletId: sarahWallet.id,
        userId: sarah.id,
        transactionId: transaction.id,
        type: tx.type as any,
        amount: tx.amount,
        balanceBefore,
        balanceAfter: sarahBalance,
        category: tx.category as any,
        source: tx.source as any,
        visibility: 'personal',
        description: tx.description,
        createdAt: subDays(new Date(), tx.daysAgo),
      },
    });
  }
  await prisma.wallet.update({ where: { id: sarahWallet.id }, data: { balance: Math.max(0, sarahBalance) } });

  // ─── Household Transactions ───────────────────────────────────
  const householdTransactions = [
    { userId: john.id, type: 'credit', amount: 1000000, category: 'transfer', description: 'John contribution - March', source: 'mtn', daysAgo: 29 },
    { userId: sarah.id, type: 'credit', amount: 800000, category: 'transfer', description: 'Sarah contribution - March', source: 'airtel', daysAgo: 28 },
    { userId: david.id, type: 'credit', amount: 700000, category: 'transfer', description: 'David contribution - March', source: 'mtn', daysAgo: 27 },
    { userId: john.id, type: 'debit', amount: 450000, category: 'utilities', description: 'NWSC water bill', merchant: 'NWSC', source: 'manual', daysAgo: 25 },
    { userId: sarah.id, type: 'debit', amount: 380000, category: 'utilities', description: 'UEDCL Electricity - Yaka', merchant: 'UEDCL', source: 'mtn', daysAgo: 22 },
    { userId: john.id, type: 'debit', amount: 250000, category: 'food', description: 'Monthly household groceries', merchant: 'Shoprite', source: 'mtn', daysAgo: 20 },
    { userId: david.id, type: 'debit', amount: 180000, category: 'food', description: 'Weekend family meals', source: 'airtel', daysAgo: 15 },
    { userId: sarah.id, type: 'debit', amount: 120000, category: 'entertainment', description: 'Family outing - Kabira Club', source: 'manual', daysAgo: 12 },
    { userId: john.id, type: 'debit', amount: 95000, category: 'utilities', description: 'Internet bill - MTN Home', merchant: 'MTN', source: 'mtn', daysAgo: 10 },
    { userId: david.id, type: 'debit', amount: 65000, category: 'transport', description: 'Household transport', source: 'manual', daysAgo: 7 },
    { userId: sarah.id, type: 'debit', amount: 45000, category: 'food', description: 'Household fruits & vegetables', source: 'manual', daysAgo: 3 },
  ];

  let hhBalance = 2500000;
  for (const tx of householdTransactions) {
    const balanceBefore = hhBalance;
    hhBalance = tx.type === 'credit' ? hhBalance + tx.amount : hhBalance - tx.amount;
    const transaction = await prisma.transaction.create({
      data: {
        walletId: householdWallet.id,
        userId: tx.userId,
        type: tx.type as any,
        amount: tx.amount,
        category: tx.category as any,
        description: tx.description,
        merchant: (tx as any).merchant,
        source: tx.source as any,
        visibility: 'household',
        createdAt: subDays(new Date(), tx.daysAgo),
      },
    });
    await prisma.ledgerEntry.create({
      data: {
        walletId: householdWallet.id,
        userId: tx.userId,
        transactionId: transaction.id,
        type: tx.type as any,
        amount: tx.amount,
        balanceBefore,
        balanceAfter: hhBalance,
        category: tx.category as any,
        source: tx.source as any,
        visibility: 'household',
        description: tx.description,
        createdAt: subDays(new Date(), tx.daysAgo),
      },
    });
  }
  await prisma.wallet.update({ where: { id: householdWallet.id }, data: { balance: Math.max(0, hhBalance) } });

  console.log('✅ Transactions and ledger entries created');

  // ─── Subscriptions ────────────────────────────────────────────
  await prisma.subscription.createMany({
    data: [
      { ownerType: 'user', userId: john.id, name: 'Netflix', category: 'entertainment', amount: 25000, billingCycle: 'monthly', nextDueDate: addDays(new Date(), 5), status: 'active' },
      { ownerType: 'user', userId: john.id, name: 'Spotify', category: 'entertainment', amount: 15000, billingCycle: 'monthly', nextDueDate: addDays(new Date(), 12), status: 'active' },
      { ownerType: 'user', userId: sarah.id, name: 'DSTV Premium', category: 'entertainment', amount: 45000, billingCycle: 'monthly', nextDueDate: addDays(new Date(), 3), status: 'active' },
      { ownerType: 'user', userId: sarah.id, name: 'Gym Membership', category: 'healthcare', amount: 80000, billingCycle: 'monthly', nextDueDate: addDays(new Date(), 20), status: 'active' },
      { ownerType: 'household', householdId: household.id, name: 'MTN Home Internet', category: 'utilities', amount: 95000, billingCycle: 'monthly', nextDueDate: addDays(new Date(), 8), status: 'active' },
      { ownerType: 'household', householdId: household.id, name: 'Showmax Family', category: 'entertainment', amount: 35000, billingCycle: 'monthly', nextDueDate: addDays(new Date(), 15), status: 'active' },
    ],
  });

  console.log('✅ Subscriptions created');

  // ─── Bills ────────────────────────────────────────────────────
  await prisma.bill.createMany({
    data: [
      { ownerType: 'user', userId: john.id, name: 'NWSC Water Bill - April', category: 'utilities', amount: 35000, dueDate: addDays(new Date(), 7), provider: 'NWSC', accountRef: '00-0123-4567' },
      { ownerType: 'user', userId: sarah.id, name: 'School Fees Q2 - St. Mary\'s', category: 'school_fees', amount: 650000, dueDate: addDays(new Date(), 14), provider: 'St. Mary\'s College' },
      { ownerType: 'household', householdId: household.id, name: 'UEDCL Electricity - April', category: 'utilities', amount: 180000, dueDate: addDays(new Date(), 4), provider: 'UEDCL', accountRef: '0-100-2345' },
      { ownerType: 'household', householdId: household.id, name: 'House Rent - April', category: 'rent', amount: 1200000, dueDate: addDays(new Date(), 2), provider: 'Landlord Kato' },
    ],
  });

  console.log('✅ Bills created');

  // ─── Budgets ──────────────────────────────────────────────────
  await prisma.budget.createMany({
    data: [
      { ownerType: 'user', userId: john.id, category: 'food', limitAmount: 300000, period: 'monthly' },
      { ownerType: 'user', userId: john.id, category: 'transport', limitAmount: 100000, period: 'monthly' },
      { ownerType: 'user', userId: john.id, category: 'entertainment', limitAmount: 80000, period: 'monthly' },
      { ownerType: 'user', userId: sarah.id, category: 'food', limitAmount: 250000, period: 'monthly' },
      { ownerType: 'user', userId: sarah.id, category: 'shopping', limitAmount: 200000, period: 'monthly' },
      { ownerType: 'household', householdId: household.id, category: 'utilities', limitAmount: 700000, period: 'monthly' },
      { ownerType: 'household', householdId: household.id, category: 'food', limitAmount: 500000, period: 'monthly' },
    ],
  });

  console.log('✅ Budgets created');

  // ─── Alerts ───────────────────────────────────────────────────
  await prisma.alert.createMany({
    data: [
      { userId: john.id, type: 'upcoming_bill', title: 'Bill Due Soon: NWSC Water', message: 'Your NWSC water bill of UGX 35,000 is due in 7 days.', status: 'unread' },
      { userId: john.id, type: 'subscription_due', title: 'Subscription Due: Netflix', message: 'Your Netflix subscription of UGX 25,000 renews in 5 days.', status: 'unread' },
      { userId: sarah.id, type: 'upcoming_bill', title: 'Electricity Bill Due', message: 'Household electricity bill of UGX 180,000 is due in 4 days.', status: 'unread' },
      { userId: john.id, type: 'budget_exceeded', title: 'Budget Alert: Entertainment', message: 'You\'ve reached 85% of your entertainment budget this month.', status: 'read' },
    ],
  });

  console.log('✅ Demo alerts created');

  // ─── Demo OTP for testing ─────────────────────────────────────
  await prisma.otp.createMany({
    data: [
      { phone: '+256700000001', code: '123456', purpose: 'login', expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), userId: john.id },
      { phone: '+256700000002', code: '123456', purpose: 'login', expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), userId: sarah.id },
      { phone: '+256700000003', code: '123456', purpose: 'login', expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), userId: david.id },
    ],
  });

  console.log('✅ Demo OTPs created (code: 123456 for all demo users)');

  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('  John:  +256700000001 | OTP: 123456');
  console.log('  Sarah: +256700000002 | OTP: 123456');
  console.log('  David: +256700000003 | OTP: 123456');
  console.log('  Household: Nakawa Family Home | Invite code: NAKAWA2024');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
