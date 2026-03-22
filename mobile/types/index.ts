export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  avatar?: string;
  platform: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Wallet {
  id: string;
  type: 'personal' | 'household';
  balance: number;
  currency: string;
  userId?: string;
  householdId?: string;
}

export interface WalletSummary {
  personal: Wallet;
  households: Array<{
    householdId: string;
    householdName: string;
    wallet: Wallet;
    role: string;
  }>;
  summary: {
    personalBalance: number;
    totalHouseholdBalance: number;
    combinedBalance: number;
  };
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  category: string;
  description?: string;
  merchant?: string;
  source: string;
  visibility: 'personal' | 'household' | 'both';
  createdAt: string;
  user?: { id: string; name: string };
  wallet?: { id: string; type: string };
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  category: string;
  source: string;
  description?: string;
  createdAt: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  members: HouseholdMember[];
  wallet?: Wallet;
  _count?: { members: number };
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    name?: string;
    phone: string;
    avatar?: string;
    personalWallet?: { balance: number };
  };
}

export interface Subscription {
  id: string;
  ownerType: 'user' | 'household';
  userId?: string;
  householdId?: string;
  name: string;
  category: string;
  amount: number;
  billingCycle: string;
  nextDueDate: string;
  status: 'active' | 'paused' | 'cancelled';
  autoRenew: boolean;
  logo?: string;
}

export interface Bill {
  id: string;
  ownerType: 'user' | 'household';
  userId?: string;
  householdId?: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidAt?: string;
  recurring: boolean;
  provider?: string;
  accountRef?: string;
}

export interface Budget {
  id: string;
  ownerType: 'user' | 'household';
  userId?: string;
  householdId?: string;
  category: string;
  limitAmount: number;
  period: string;
  spentAmount: number;
  remainingAmount: number;
  usagePercent: number;
  isOverBudget: boolean;
}

export interface Alert {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'dismissed';
  createdAt: string;
}

export interface ForecastProjection {
  month: string;
  projectedBalance: number;
  projectedSpend: number;
  projectedIncome: number;
}

export interface PersonalForecast {
  currentBalance: number;
  burnRate: number;
  avgMonthlySpend: number;
  avgMonthlyIncome: number;
  monthlySubscriptionCost: number;
  daysUntilZero: number;
  projections: ForecastProjection[];
  recurringExpenses: Array<{ name: string; amount: number; nextDue: string }>;
}

export interface AnalyticsData {
  thisMonth: { total: number; change: number; trend: string };
  lastMonth: { total: number };
  byCategory: Array<{ category: string; amount: number; percentage: number }>;
  topMerchants: Array<{ merchant: string; amount: number; count: number }>;
  dailySpend: Array<{ date: string; amount: number }>;
}

export interface HouseholdFinancialSummary {
  household: { id: string; name: string; walletBalance: number };
  totalSpentThisMonth: number;
  memberBreakdown: Array<{
    userId: string;
    name: string;
    totalSpent: number;
    totalEarned: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
