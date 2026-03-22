import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useWalletStore } from '../store/walletStore';
import api from '../services/api';
import { COLORS, BILL_PROVIDERS } from '../constants';

export default function PayBillScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { summary, fetchSummary } = useWalletStore();

  const [step, setStep] = useState<'select' | 'details'>('select');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [accountRef, setAccountRef] = useState('');
  const [walletType, setWalletType] = useState<'personal' | 'household'>('personal');
  const [isLoading, setIsLoading] = useState(false);

  const { data: bills } = useQuery({
    queryKey: ['bills'],
    queryFn: () => api.bills.getAll(),
    staleTime: 60000,
  });

  useEffect(() => {
    if (!summary) fetchSummary();
  }, []);

  const personalWalletId = summary?.personal?.id;
  const householdWallet = summary?.households?.[0]?.wallet;
  const selectedWalletId = walletType === 'personal' ? personalWalletId : householdWallet?.id;
  const selectedBalance = walletType === 'personal'
    ? Number(summary?.personal?.balance || 0)
    : Number(householdWallet?.balance || 0);

  const handlePayBill = async (bill: any) => {
    if (!selectedWalletId) return;
    setIsLoading(true);
    try {
      await api.payments.payBill({
        billId: bill.id,
        walletId: selectedWalletId,
        amount: Number(bill.amount),
        provider: bill.provider || bill.name,
        accountRef: bill.accountRef,
      });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-bills'] });
      await fetchSummary();
      Toast.show({ type: 'success', text1: '✅ Bill paid!', text2: `${bill.name} paid successfully` });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectPayment = async () => {
    if (!selectedProvider || !amount || !selectedWalletId) return;
    setIsLoading(true);
    try {
      await api.payments.directPayment({
        walletId: selectedWalletId,
        amount: Number(amount),
        provider: selectedProvider.key,
        accountRef: accountRef || undefined,
        description: `${selectedProvider.label} payment`,
      });
      await fetchSummary();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      Toast.show({ type: 'success', text1: '✅ Payment successful!', text2: `UGX ${Number(amount).toLocaleString()} paid to ${selectedProvider.label}` });
      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const unpaidBills = Array.isArray(bills) ? bills.filter((b: any) => !b.isPaid) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Wallet Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Pay From</Text>
        <View style={styles.walletRow}>
          <TouchableOpacity
            style={[styles.walletBtn, walletType === 'personal' && styles.walletBtnActive]}
            onPress={() => setWalletType('personal')}
          >
            <Text style={styles.walletIcon}>👤</Text>
            <Text style={styles.walletName}>Personal</Text>
            <Text style={styles.walletBalance}>UGX {Number(summary?.personal?.balance || 0).toLocaleString()}</Text>
          </TouchableOpacity>
          {householdWallet && (
            <TouchableOpacity
              style={[styles.walletBtn, walletType === 'household' && styles.walletBtnActive]}
              onPress={() => setWalletType('household')}
            >
              <Text style={styles.walletIcon}>🏠</Text>
              <Text style={styles.walletName}>Household</Text>
              <Text style={styles.walletBalance}>UGX {Number(householdWallet.balance).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pending Bills */}
      {unpaidBills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Bills</Text>
          {unpaidBills.map((bill: any) => (
            <View key={bill.id} style={styles.billCard}>
              <View>
                <Text style={styles.billName}>{bill.name}</Text>
                <Text style={styles.billDue}>Due: {new Date(bill.dueDate).toLocaleDateString()}</Text>
                {bill.provider && <Text style={styles.billProvider}>{bill.provider}</Text>}
              </View>
              <View style={styles.billRight}>
                <Text style={styles.billAmount}>UGX {Number(bill.amount).toLocaleString()}</Text>
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => handlePayBill(bill)}
                  disabled={isLoading}
                >
                  {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.payBtnText}>Pay Now</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Direct Payment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direct Payment</Text>
        <Text style={styles.sectionSubtitle}>Pay utilities, school fees, rent, and more</Text>

        {step === 'select' ? (
          <View style={styles.providerGrid}>
            {BILL_PROVIDERS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.providerCard, selectedProvider?.key === p.key && styles.providerCardActive]}
                onPress={() => { setSelectedProvider(p); setStep('details'); }}
              >
                <Text style={styles.providerIcon}>{p.icon}</Text>
                <Text style={styles.providerLabel}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View style={styles.selectedProvider}>
              <Text style={styles.selectedProviderIcon}>{selectedProvider.icon}</Text>
              <Text style={styles.selectedProviderName}>{selectedProvider.label}</Text>
              <TouchableOpacity onPress={() => { setStep('select'); setSelectedProvider(null); }}>
                <Text style={{ color: COLORS.primary, fontSize: 13 }}>Change</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.label}>Account / Meter Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account reference"
                placeholderTextColor={COLORS.textMuted}
                value={accountRef}
                onChangeText={setAccountRef}
                autoFocus
              />
            </View>

            <View>
              <Text style={styles.label}>Amount (UGX)</Text>
              <TextInput
                style={[styles.input, { fontSize: 20, fontWeight: '700' }]}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            {Number(amount) > selectedBalance && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>⚠️ Insufficient balance</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, (isLoading || !amount || Number(amount) > selectedBalance) && styles.submitBtnDisabled]}
              onPress={handleDirectPayment}
              disabled={isLoading || !amount || Number(amount) > selectedBalance}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Pay UGX {Number(amount || 0).toLocaleString()} →</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: 20, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 14 },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 10 },
  walletRow: { flexDirection: 'row', gap: 12 },
  walletBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', gap: 4 },
  walletBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  walletIcon: { fontSize: 22 },
  walletName: { fontSize: 12, color: COLORS.textSecondary },
  walletBalance: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  billCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  billName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  billDue: { fontSize: 12, color: COLORS.warning, marginTop: 2 },
  billProvider: { fontSize: 11, color: COLORS.textMuted },
  billRight: { alignItems: 'flex-end', gap: 8 },
  billAmount: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  payBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  payBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  providerCard: { width: '30%', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  providerCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  providerIcon: { fontSize: 28 },
  providerLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  selectedProvider: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: COLORS.primary },
  selectedProviderIcon: { fontSize: 24 },
  selectedProviderName: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '600' },
  input: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, height: 56, color: COLORS.text, fontSize: 16 },
  warningBox: { backgroundColor: COLORS.warning + '15', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.warning + '30' },
  warningText: { color: COLORS.warning, fontSize: 13 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
