import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { COLORS, CATEGORIES } from '../../constants';
import { Transaction } from '../../types';

const SCOPES = [
  { key: 'all', label: 'All' },
  { key: 'personal', label: 'Personal' },
  { key: 'household', label: 'Household' },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const [scope, setScope] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', scope, page],
    queryFn: () => api.transactions.getAll({ scope: scope !== 'all' ? scope : undefined, page, limit: 30 }),
    staleTime: 30000,
  });

  const transactions: Transaction[] = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const filtered = search
    ? transactions.filter((tx) =>
        (tx.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (tx.merchant || '').toLowerCase().includes(search.toLowerCase()) ||
        tx.category.toLowerCase().includes(search.toLowerCase()),
      )
    : transactions;

  const getCategoryInfo = (cat: string) =>
    CATEGORIES.find((c) => c.key === cat) || { icon: '💳', color: '#888', label: cat };

  const renderTx = ({ item: tx }: { item: Transaction }) => {
    const cat = getCategoryInfo(tx.category);
    return (
      <TouchableOpacity
        style={styles.txItem}
        onPress={() => router.push({ pathname: '/transaction-detail', params: { id: tx.id } })}
      >
        <View style={[styles.txIconContainer, { backgroundColor: cat.color + '20' }]}>
          <Text style={styles.txIcon}>{cat.icon}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {tx.description || tx.merchant || cat.label}
          </Text>
          <View style={styles.txMeta}>
            <Text style={styles.txCategory}>{cat.label}</Text>
            <Text style={styles.txDot}>•</Text>
            <Text style={styles.txSource}>{tx.source}</Text>
            {tx.wallet?.type === 'household' && (
              <>
                <Text style={styles.txDot}>•</Text>
                <Text style={[styles.txSource, { color: COLORS.primary }]}>🏠 HH</Text>
              </>
            )}
          </View>
          <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}</Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: tx.type === 'credit' ? COLORS.success : COLORS.error }]}>
            {tx.type === 'credit' ? '+' : '-'}UGX {Number(tx.amount).toLocaleString()}
          </Text>
          {tx.user?.name && <Text style={styles.txUser}>{tx.user.name.split(' ')[0]}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Scope Filter */}
      <View style={styles.scopeFilter}>
        {SCOPES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.scopeTab, scope === s.key && styles.scopeTabActive]}
            onPress={() => { setScope(s.key); setPage(1); }}
          >
            <Text style={[styles.scopeText, scope === s.key && styles.scopeTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderTx}
          contentContainerStyle={{ padding: 16, gap: 6, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
          ListFooterComponent={
            meta?.hasNext ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => setPage((p) => p + 1)}
              >
                <Text style={styles.loadMoreText}>Load more</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 48,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  scopeFilter: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  scopeTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  scopeTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  scopeText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  scopeTextActive: { color: '#fff', fontWeight: '700' },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  txIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txIcon: { fontSize: 20 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  txCategory: { fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize' },
  txDot: { fontSize: 10, color: COLORS.textMuted },
  txSource: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase' },
  txDate: { fontSize: 11, color: COLORS.textMuted },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txUser: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: COLORS.textMuted },
  loadMore: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, alignItems: 'center', margin: 16 },
  loadMoreText: { color: COLORS.primary, fontWeight: '600' },
});
