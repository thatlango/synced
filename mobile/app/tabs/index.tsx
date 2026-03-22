import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import api from '../../services/api';
import { COLORS } from '../../constants';
import { formatCurrency } from '../../utils/format';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { summary, fetchSummary } = useWalletStore();

  const { data: upcomingBills, isLoading: billsLoading } = useQuery({
    queryKey: ['upcoming-bills'],
    queryFn: () => api.bills.getUpcoming(7),
    staleTime: 60000,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions-summary'],
    queryFn: () => api.subscriptions.getAll(),
    staleTime: 60000,
  });

  const { data: budgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.budgets.getAll(),
    staleTime: 60000,
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts-unread'],
    queryFn: () => api.alerts.getUnreadCount(),
    staleTime: 30000,
  });

  const { data: transactions, isLoading: txLoading, refetch } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => api.transactions.getAll({ limit: 5 }),
    staleTime: 30000,
  });

  const onRefresh = useCallback(() => {
    fetchSummary();
    refetch();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const personalBalance = summary?.summary?.personalBalance || 0;
  const householdBalance = summary?.summary?.totalHouseholdBalance || 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'there'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.alertBell} onPress={() => {}}>
            <Text style={styles.bellIcon}>🔔</Text>
            {(alerts as any)?.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{(alerts as any).count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Balance Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsScroll}>
          {/* Personal Balance */}
          <View style={[styles.balanceCard, styles.personalCard]}>
            <Text style={styles.cardLabel}>Personal Balance</Text>
            <Text style={styles.cardBalance}>{formatCurrency(personalBalance)}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>💳 Personal Wallet</Text>
              <TouchableOpacity onPress={() => router.push('/fund-wallet')}>
                <Text style={styles.cardAction}>+ Fund</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Household Balance */}
          {summary?.households?.map((h) => (
            <View key={h.householdId} style={[styles.balanceCard, styles.householdCard]}>
              <Text style={styles.cardLabel}>{h.householdName}</Text>
              <Text style={styles.cardBalance}>{formatCurrency(Number(h.wallet?.balance || 0))}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>👨‍👩‍👧 Household</Text>
                <Text style={styles.roleText}>{h.role}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Text style={styles.quickActionEmoji}>{action.icon}</Text>
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Bills */}
        {(upcomingBills as any)?.summary?.count > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Bills</Text>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>{(upcomingBills as any).summary.count} due</Text>
              </View>
            </View>
            <View style={styles.billsCard}>
              <Text style={styles.billsTotal}>
                UGX {formatCurrency((upcomingBills as any).summary.totalUpcoming)} total
              </Text>
              <View style={styles.billsList}>
                {(upcomingBills as any)?.bills?.slice(0, 3).map((bill: any) => (
                  <View key={bill.id} style={styles.billItem}>
                    <Text style={styles.billName}>{bill.name}</Text>
                    <Text style={styles.billAmount}>{formatCurrency(Number(bill.amount))}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity onPress={() => router.push('/pay-bill')} style={styles.payNowBtn}>
                <Text style={styles.payNowText}>Pay Bills →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Budget Progress */}
        {budgets && Array.isArray(budgets) && (budgets as any[]).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Progress</Text>
            <View style={styles.budgetsGrid}>
              {(budgets as any[]).slice(0, 4).map((b) => (
                <BudgetCard key={b.id} budget={b} />
              ))}
            </View>
          </View>
        )}

        {/* Subscriptions */}
        {(subscriptions as any)?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscriptions</Text>
            <View style={styles.subscriptionSummaryCard}>
              <View style={styles.subSummaryRow}>
                <View>
                  <Text style={styles.subCount}>{(subscriptions as any).summary.total} active</Text>
                  <Text style={styles.subLabel}>subscriptions</Text>
                </View>
                <View style={styles.subRight}>
                  <Text style={styles.subMonthly}>{formatCurrency((subscriptions as any).summary.monthlyTotal)}</Text>
                  <Text style={styles.subLabel}>/month</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/tabs/transactions')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {txLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.txList}>
              {((transactions as any)?.data || []).slice(0, 5).map((tx: any) => (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.txItem}
                  onPress={() => router.push({ pathname: '/transaction-detail', params: { id: tx.id } })}
                >
                  <View style={styles.txLeft}>
                    <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? COLORS.success + '20' : COLORS.error + '20' }]}>
                      <Text style={{ fontSize: 16 }}>{tx.type === 'credit' ? '💚' : '🔴'}</Text>
                    </View>
                    <View>
                      <Text style={styles.txDescription} numberOfLines={1}>{tx.description || tx.merchant || tx.category}</Text>
                      <Text style={styles.txMeta}>{tx.category} • {tx.source}</Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? COLORS.success : COLORS.error }]}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </Text>
                </TouchableOpacity>
              ))}
              {!(transactions as any)?.data?.length && (
                <Text style={styles.emptyText}>No transactions yet</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-expense')}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function BudgetCard({ budget }: { budget: any }) {
  const pct = Math.min(budget.usagePercent, 100);
  const color = pct >= 90 ? COLORS.error : pct >= 70 ? COLORS.warning : COLORS.success;

  return (
    <View style={styles.budgetCard}>
      <Text style={styles.budgetCategory}>{budget.category}</Text>
      <View style={styles.budgetBar}>
        <View style={[styles.budgetFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.budgetPct}>{pct}%</Text>
    </View>
  );
}

const QUICK_ACTIONS = [
  { label: 'Add Expense', icon: '➕', route: '/add-expense', color: COLORS.primary },
  { label: 'Pay Bill', icon: '📄', route: '/pay-bill', color: COLORS.warning },
  { label: 'Fund Wallet', icon: '💰', route: '/fund-wallet', color: COLORS.success },
  { label: 'Subscriptions', icon: '🔄', route: '/tabs/transactions', color: COLORS.secondary },
];

const formatCurrency = (n: number) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16 },
  greetingText: { fontSize: 14, color: COLORS.textSecondary },
  userName: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  alertBell: { position: 'relative', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bellIcon: { fontSize: 24 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.error, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardsScroll: { paddingLeft: 20, marginBottom: 8 },
  balanceCard: { width: 220, marginRight: 14, borderRadius: 20, padding: 20, marginBottom: 4 },
  personalCard: { backgroundColor: COLORS.primary },
  householdCard: { backgroundColor: '#1e3a5f' },
  cardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  cardBalance: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFooterText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  cardAction: { fontSize: 12, color: '#fff', fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickActionEmoji: { fontSize: 22 },
  quickActionLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  billsCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.warning + '30' },
  billsTotal: { fontSize: 18, fontWeight: '700', color: COLORS.warning, marginBottom: 12 },
  billsList: { gap: 8, marginBottom: 12 },
  billItem: { flexDirection: 'row', justifyContent: 'space-between' },
  billName: { fontSize: 14, color: COLORS.text },
  billAmount: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  payNowBtn: { backgroundColor: COLORS.warning + '20', borderRadius: 10, padding: 10, alignItems: 'center' },
  payNowText: { color: COLORS.warning, fontWeight: '700', fontSize: 14 },
  urgentBadge: { backgroundColor: COLORS.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  urgentText: { color: COLORS.warning, fontSize: 12, fontWeight: '600' },
  budgetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  budgetCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  budgetCategory: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, textTransform: 'capitalize' },
  budgetBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  budgetFill: { height: '100%', borderRadius: 3 },
  budgetPct: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },
  subscriptionSummaryCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  subSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subCount: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  subLabel: { fontSize: 13, color: COLORS.textSecondary },
  subRight: { alignItems: 'flex-end' },
  subMonthly: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  txList: { gap: 2 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txDescription: { fontSize: 14, fontWeight: '600', color: COLORS.text, maxWidth: 180 },
  txMeta: { fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, padding: 20 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  fabIcon: { fontSize: 28, color: '#fff', fontWeight: '300', lineHeight: 32 },
});
