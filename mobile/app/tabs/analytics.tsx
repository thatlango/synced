import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { COLORS, CATEGORIES } from '../../constants';

const PERIODS = ['week', 'month', 'year'] as const;

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const { data: insights, isLoading } = useQuery({
    queryKey: ['analytics-personal'],
    queryFn: () => api.analytics.personal(),
    staleTime: 60000,
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => api.analytics.trends(6),
    staleTime: 120000,
  });

  const { data: txSummary } = useQuery({
    queryKey: ['tx-summary', period],
    queryFn: () => api.transactions.getSummary(period),
    staleTime: 60000,
  });

  const { data: forecast } = useQuery({
    queryKey: ['personal-forecast'],
    queryFn: () => api.forecasts.personal(),
    staleTime: 120000,
  });

  const data = insights as any;
  const trendsData = trends as any;
  const fc = forecast as any;
  const summary = txSummary as any;

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: COLORS.error + '40' }]}>
          <Text style={styles.summaryLabel}>Spent</Text>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>
            UGX {Number(summary?.totalSpent || 0).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: COLORS.success + '40' }]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            UGX {Number(summary?.totalEarned || 0).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: COLORS.primary + '40' }]}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
            UGX {Number(summary?.netFlow || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Month vs Last Month */}
      {data?.thisMonth && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>vs Last Month</Text>
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonItem}>
              <Text style={styles.compLabel}>This Month</Text>
              <Text style={styles.compValue}>UGX {Number(data.thisMonth.total).toLocaleString()}</Text>
            </View>
            <View style={styles.compDivider} />
            <View style={styles.comparisonItem}>
              <Text style={styles.compLabel}>Last Month</Text>
              <Text style={styles.compValue}>UGX {Number(data.lastMonth?.total || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.compTrend}>
              <Text style={[styles.trendText, { color: data.thisMonth.trend === 'up' ? COLORS.error : data.thisMonth.trend === 'down' ? COLORS.success : COLORS.warning }]}>
                {data.thisMonth.trend === 'up' ? '↑' : data.thisMonth.trend === 'down' ? '↓' : '→'} {Math.abs(data.thisMonth.change)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Spending by Category */}
      {data?.byCategory && data.byCategory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {data.byCategory.slice(0, 8).map((cat: any) => {
            const info = CATEGORIES.find((c) => c.key === cat.category);
            return (
              <View key={cat.category} style={styles.catRow}>
                <Text style={styles.catIcon}>{info?.icon || '💳'}</Text>
                <View style={styles.catInfo}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{info?.label || cat.category}</Text>
                    <Text style={styles.catAmount}>UGX {Number(cat.amount).toLocaleString()}</Text>
                  </View>
                  <View style={styles.catBar}>
                    <View style={[styles.catFill, { width: `${cat.percentage}%`, backgroundColor: info?.color || COLORS.primary }]} />
                  </View>
                  <Text style={styles.catPct}>{cat.percentage}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Top Merchants */}
      {data?.topMerchants && data.topMerchants.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Merchants</Text>
          {data.topMerchants.map((m: any, i: number) => (
            <View key={i} style={styles.merchantRow}>
              <View style={styles.merchantRank}>
                <Text style={styles.rankText}>{i + 1}</Text>
              </View>
              <Text style={styles.merchantName} numberOfLines={1}>{m.merchant}</Text>
              <View style={styles.merchantRight}>
                <Text style={styles.merchantAmount}>UGX {Number(m.amount).toLocaleString()}</Text>
                <Text style={styles.merchantCount}>{m.count} txns</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Monthly Trends */}
      {trendsData && trendsData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6-Month Trend</Text>
          <View style={styles.trendsCard}>
            {trendsData.map((t: any) => {
              const maxSpend = Math.max(...trendsData.map((x: any) => x.spend));
              const height = maxSpend > 0 ? (t.spend / maxSpend) * 80 : 4;
              return (
                <View key={t.month} style={styles.trendBar}>
                  <Text style={styles.trendAmount}>{t.spend >= 1000000 ? `${(t.spend / 1000000).toFixed(1)}M` : t.spend >= 1000 ? `${(t.spend / 1000).toFixed(0)}K` : `${t.spend}`}</Text>
                  <View style={[styles.trendBarFill, { height, backgroundColor: t.spend > 0 ? COLORS.primary : COLORS.border }]} />
                  <Text style={styles.trendMonth}>{t.month.split(' ')[0]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Forecast Section */}
      {fc && (
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>Financial Forecast</Text>
          <View style={styles.forecastCard}>
            <View style={styles.forecastRow}>
              <View>
                <Text style={styles.forecastLabel}>Avg Monthly Spend</Text>
                <Text style={styles.forecastValue}>UGX {Number(fc.avgMonthlySpend).toLocaleString()}</Text>
              </View>
              <View style={styles.forecastDivider} />
              <View>
                <Text style={styles.forecastLabel}>Days Until Zero</Text>
                <Text style={[styles.forecastValue, { color: fc.daysUntilZero < 30 ? COLORS.error : COLORS.success }]}>
                  {fc.daysUntilZero >= 999 ? '∞' : fc.daysUntilZero} days
                </Text>
              </View>
            </View>
            {fc.projections?.slice(0, 3).map((p: any) => (
              <View key={p.month} style={styles.projRow}>
                <Text style={styles.projMonth}>{p.month}</Text>
                <Text style={[styles.projBalance, { color: p.projectedBalance > 0 ? COLORS.success : COLORS.error }]}>
                  UGX {Number(p.projectedBalance).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  periodSelector: { flexDirection: 'row', margin: 16, backgroundColor: COLORS.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  periodTab: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  periodTabActive: { backgroundColor: COLORS.primary },
  periodText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  periodTextActive: { color: '#fff', fontWeight: '700' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 12, borderWidth: 1 },
  summaryLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  section: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  comparisonCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center' },
  comparisonItem: { flex: 1, alignItems: 'center' },
  compLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  compValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  compDivider: { width: 1, height: 40, backgroundColor: COLORS.border, marginHorizontal: 12 },
  compTrend: { position: 'absolute', top: -12, right: 16, backgroundColor: COLORS.surface, padding: 4 },
  trendText: { fontSize: 13, fontWeight: '700' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  catIcon: { fontSize: 20, width: 28 },
  catInfo: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: 13, color: COLORS.text, fontWeight: '500', textTransform: 'capitalize' },
  catAmount: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  catBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
  catFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },
  merchantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  merchantRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  merchantName: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  merchantRight: { alignItems: 'flex-end' },
  merchantAmount: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  merchantCount: { fontSize: 11, color: COLORS.textMuted },
  trendsCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  trendBar: { alignItems: 'center', flex: 1, gap: 4, justifyContent: 'flex-end' },
  trendAmount: { fontSize: 8, color: COLORS.textMuted, textAlign: 'center' },
  trendBarFill: { width: 20, borderRadius: 4, minHeight: 4 },
  trendMonth: { fontSize: 9, color: COLORS.textMuted },
  forecastCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  forecastRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  forecastLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  forecastValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  forecastDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 20 },
  projRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projMonth: { fontSize: 13, color: COLORS.textSecondary },
  projBalance: { fontSize: 13, fontWeight: '700' },
});
