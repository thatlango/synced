import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import api from '../services/api';
import { COLORS, CATEGORIES, QUICK_AMOUNTS } from '../constants';

const TYPES = [
  { key: 'debit', label: 'Expense', icon: '📤', color: COLORS.error },
  { key: 'credit', label: 'Income', icon: '📥', color: COLORS.success },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { summary, fetchSummary } = useWalletStore();

  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('food');
  const [walletType, setWalletType] = useState<'personal' | 'household'>('personal');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!summary) fetchSummary();
  }, []);

  const personalWalletId = summary?.personal?.id;
  const householdWallet = summary?.households?.[0]?.wallet;

  const selectedWalletId = walletType === 'personal' ? personalWalletId : householdWallet?.id;
  const selectedBalance = walletType === 'personal'
    ? Number(summary?.personal?.balance || 0)
    : Number(householdWallet?.balance || 0);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid amount' });
      return;
    }
    if (!selectedWalletId) {
      Toast.show({ type: 'error', text1: 'No wallet available' });
      return;
    }

    setIsLoading(true);
    try {
      await api.transactions.create({
        walletId: selectedWalletId,
        type,
        amount: Number(amount),
        category,
        description: description || undefined,
        merchant: merchant || undefined,
        source: 'manual',
        visibility: walletType,
      });

      await fetchSummary();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });

      Toast.show({ type: 'success', text1: 'Transaction added!', text2: `UGX ${Number(amount).toLocaleString()} ${type === 'debit' ? 'expense' : 'income'} recorded` });
      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Type Selector */}
        <View style={styles.typeRow}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeBtn, type === t.key && { borderColor: t.color, backgroundColor: t.color + '15' }]}
              onPress={() => setType(t.key as any)}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={[styles.typeLabel, type === t.key && { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wallet Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>From Wallet</Text>
          <View style={styles.walletRow}>
            <TouchableOpacity
              style={[styles.walletBtn, walletType === 'personal' && styles.walletBtnActive]}
              onPress={() => setWalletType('personal')}
            >
              <Text style={styles.walletIcon}>👤</Text>
              <Text style={styles.walletLabel}>Personal</Text>
              <Text style={styles.walletBalance}>UGX {Number(summary?.personal?.balance || 0).toLocaleString()}</Text>
            </TouchableOpacity>
            {householdWallet && (
              <TouchableOpacity
                style={[styles.walletBtn, walletType === 'household' && styles.walletBtnActive]}
                onPress={() => setWalletType('household')}
              >
                <Text style={styles.walletIcon}>🏠</Text>
                <Text style={styles.walletLabel}>Household</Text>
                <Text style={styles.walletBalance}>UGX {Number(householdWallet.balance || 0).toLocaleString()}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount (UGX)</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.amountPrefix}>UGX</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />
          </View>

          {/* Quick amounts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {QUICK_AMOUNTS.map((qa) => (
                <TouchableOpacity
                  key={qa}
                  style={styles.quickAmount}
                  onPress={() => setAmount(qa.toString())}
                >
                  <Text style={styles.quickAmountText}>
                    {qa >= 1000000 ? `${qa / 1000000}M` : `${qa / 1000}K`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CATEGORIES.slice(0, type === 'credit' ? 4 : 12).map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catChip, category === cat.key && { backgroundColor: cat.color + '25', borderColor: cat.color }]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={styles.catChipIcon}>{cat.icon}</Text>
                  <Text style={[styles.catChipLabel, category === cat.key && { color: cat.color }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="What was this for?"
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Merchant */}
        <View style={styles.section}>
          <Text style={styles.label}>Merchant / Payee (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Cafe Javas, Shoprite..."
            placeholderTextColor={COLORS.textMuted}
            value={merchant}
            onChangeText={setMerchant}
          />
        </View>

        {/* Insufficient balance warning */}
        {type === 'debit' && Number(amount) > selectedBalance && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ Amount exceeds wallet balance (UGX {selectedBalance.toLocaleString()})</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (isLoading || (type === 'debit' && Number(amount) > selectedBalance)) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || (type === 'debit' && Number(amount) > selectedBalance)}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {type === 'debit' ? '📤 Record Expense' : '📥 Record Income'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: COLORS.border },
  typeIcon: { fontSize: 20 },
  typeLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  section: { marginBottom: 20 },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  walletRow: { flexDirection: 'row', gap: 12 },
  walletBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', gap: 4 },
  walletBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  walletIcon: { fontSize: 22 },
  walletLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  walletBalance: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  amountContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, height: 64, gap: 10 },
  amountPrefix: { fontSize: 18, color: COLORS.textSecondary, fontWeight: '600' },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '700', color: COLORS.text },
  quickAmount: { backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  quickAmountText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  catChipIcon: { fontSize: 16 },
  catChipLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  input: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, height: 52, color: COLORS.text, fontSize: 15 },
  warningBox: { backgroundColor: COLORS.warning + '15', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  warningText: { color: COLORS.warning, fontSize: 13, fontWeight: '500' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 16, height: 60, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
