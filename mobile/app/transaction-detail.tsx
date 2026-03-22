import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { COLORS, CATEGORIES } from '../constants';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => api.transactions.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const transaction = tx as any;
  if (!transaction) return null;

  const catInfo = CATEGORIES.find((c) => c.key === transaction.category);
  const isCredit = transaction.type === 'credit';

  return (
    <ScrollView style={styles.container}>
      {/* Amount Display */}
      <View style={[styles.amountSection, { backgroundColor: isCredit ? COLORS.success + '15' : COLORS.error + '15' }]}>
        <Text style={styles.categoryIcon}>{catInfo?.icon || '💳'}</Text>
        <Text style={[styles.amount, { color: isCredit ? COLORS.success : COLORS.error }]}>
          {isCredit ? '+' : '-'}UGX {Number(transaction.amount).toLocaleString()}
        </Text>
        <Text style={styles.typeLabel}>{isCredit ? 'Income' : 'Expense'}</Text>
      </View>

      {/* Details */}
      <View style={styles.detailsCard}>
        <DetailRow label="Description" value={transaction.description || '-'} />
        <DetailRow label="Merchant" value={transaction.merchant || '-'} />
        <DetailRow label="Category" value={catInfo?.label || transaction.category} icon={catInfo?.icon} />
        <DetailRow label="Source" value={transaction.source.toUpperCase()} />
        <DetailRow label="Wallet" value={transaction.wallet?.type === 'household' ? '🏠 Household' : '👤 Personal'} />
        <DetailRow label="Initiated by" value={transaction.user?.name || 'Unknown'} />
        <DetailRow label="Date" value={new Date(transaction.createdAt).toLocaleString('en-UG', { dateStyle: 'full', timeStyle: 'short' })} />
        <DetailRow label="Transaction ID" value={transaction.id} small />
      </View>

      {/* Ledger Info */}
      {transaction.ledgerEntry && (
        <View style={styles.ledgerCard}>
          <Text style={styles.ledgerTitle}>Ledger Entry</Text>
          <DetailRow label="Balance Before" value={`UGX ${Number(transaction.ledgerEntry.balanceBefore).toLocaleString()}`} />
          <DetailRow label="Balance After" value={`UGX ${Number(transaction.ledgerEntry.balanceAfter).toLocaleString()}`} />
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value, icon, small }: { label: string; value: string; icon?: string; small?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, small && { fontSize: 11, color: COLORS.textMuted }]}>
        {icon && `${icon} `}{value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  amountSection: { alignItems: 'center', padding: 32, gap: 8 },
  categoryIcon: { fontSize: 48, marginBottom: 8 },
  amount: { fontSize: 36, fontWeight: '800' },
  typeLabel: { fontSize: 14, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  detailsCard: { margin: 16, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  ledgerCard: { marginHorizontal: 16, marginBottom: 32, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  ledgerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  detailValue: { fontSize: 14, color: COLORS.text, fontWeight: '500', flex: 2, textAlign: 'right' },
});
