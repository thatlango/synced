export const COLORS = {
  primary: '#216B46',
  primaryLight: '#E7F3EC',
  primaryDark: '#174E34',
  secondary: '#E85D75',
  accent: '#2F8A5A',
  background: '#F7F9F7',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F2',
  card: '#FFFFFF',
  border: '#E1E8E3',
  text: '#17231C',
  textSecondary: '#5F6F65',
  textMuted: '#8A978F',
  success: '#2F8A5A',
  warning: '#B7791F',
  error: '#C94B5F',
  income: '#2F8A5A',
  expense: '#C94B5F',
  overlay: 'rgba(23,35,28,0.36)',
  elevated: '#FCFDFC',
  info: '#2E6F9E',
  white: '#FFFFFF',
};

export const UI = {
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 20,
  touchTarget: 44,
  cardPadding: 16,
  screenPadding: 20,
};

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const CATEGORIES = [
  { key: 'food', label: 'Food', icon: '🍽️', color: '#D88447' },
  { key: 'transport', label: 'Transport', icon: '🚗', color: '#4E8CB8' },
  { key: 'utilities', label: 'Utilities', icon: '⚡', color: '#C9972C' },
  { key: 'subscriptions', label: 'Subscriptions', icon: '📺', color: '#7F74C9' },
  { key: 'rent', label: 'Rent', icon: '🏠', color: '#C96687' },
  { key: 'school_fees', label: 'School Fees', icon: '🎓', color: '#278665' },
  { key: 'entertainment', label: 'Entertainment', icon: '🎮', color: '#B96A4F' },
  { key: 'savings', label: 'Savings', icon: '💰', color: '#278A8A' },
  { key: 'healthcare', label: 'Healthcare', icon: '🏥', color: '#5284B8' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️', color: '#C96687' },
  { key: 'fuel', label: 'Fuel', icon: '⛽', color: '#65746B' },
  { key: 'mobile_data', label: 'Mobile Data', icon: '📱', color: '#3D78A6' },
  { key: 'salary', label: 'Salary', icon: '💼', color: '#2F8A5A' },
  { key: 'transfer', label: 'Transfer', icon: '↔️', color: '#7C8A81' },
  { key: 'bill_payment', label: 'Bill Payment', icon: '📄', color: '#B7892F' },
  { key: 'other', label: 'Other', icon: '💳', color: '#7B8980' },
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