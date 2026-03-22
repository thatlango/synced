export const COLORS = {
  primary: '#6c63ff',
  primaryLight: '#8b85ff',
  primaryDark: '#4a42cc',
  secondary: '#ff6584',
  accent: '#43e97b',
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceLight: '#252540',
  card: '#1e1e35',
  border: '#2a2a45',
  text: '#ffffff',
  textSecondary: '#a0a0c0',
  textMuted: '#606080',
  success: '#43e97b',
  warning: '#ffd166',
  error: '#ef476f',
  income: '#43e97b',
  expense: '#ef476f',
};

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const CATEGORIES = [
  { key: 'food', label: 'Food', icon: '🍽️', color: '#ff9a56' },
  { key: 'transport', label: 'Transport', icon: '🚗', color: '#56b4e9' },
  { key: 'utilities', label: 'Utilities', icon: '⚡', color: '#ffd166' },
  { key: 'subscriptions', label: 'Subscriptions', icon: '📺', color: '#a29bfe' },
  { key: 'rent', label: 'Rent', icon: '🏠', color: '#fd79a8' },
  { key: 'school_fees', label: 'School Fees', icon: '🎓', color: '#00b894' },
  { key: 'entertainment', label: 'Entertainment', icon: '🎮', color: '#e17055' },
  { key: 'savings', label: 'Savings', icon: '💰', color: '#00cec9' },
  { key: 'healthcare', label: 'Healthcare', icon: '🏥', color: '#74b9ff' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️', color: '#fd79a8' },
  { key: 'fuel', label: 'Fuel', icon: '⛽', color: '#636e72' },
  { key: 'mobile_data', label: 'Mobile Data', icon: '📱', color: '#0984e3' },
  { key: 'salary', label: 'Salary', icon: '💼', color: '#43e97b' },
  { key: 'transfer', label: 'Transfer', icon: '↔️', color: '#b2bec3' },
  { key: 'bill_payment', label: 'Bill Payment', icon: '📄', color: '#fdcb6e' },
  { key: 'other', label: 'Other', icon: '💳', color: '#dfe6e9' },
];

export const BILL_PROVIDERS = [
  { key: 'NWSC', label: 'NWSC Water', icon: '💧', category: 'utilities' },
  { key: 'UEDCL', label: 'UEDCL Electricity', icon: '⚡', category: 'utilities' },
  { key: 'DSTV', label: 'DSTV TV', icon: '📺', category: 'entertainment' },
  { key: 'School', label: 'School Fees', icon: '🎓', category: 'school_fees' },
  { key: 'Rent', label: 'Rent', icon: '🏠', category: 'rent' },
  { key: 'MTN', label: 'MTN Data/Airtime', icon: '📱', category: 'mobile_data' },
  { key: 'Airtel', label: 'Airtel Data/Airtime', icon: '📡', category: 'mobile_data' },
];

export const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000, 200000, 500000];
