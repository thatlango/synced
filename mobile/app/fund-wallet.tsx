import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useWalletStore } from '../store/walletStore';
import { COLORS, QUICK_AMOUNTS } from '../constants';

const SOURCES = [
  { key: 'mtn', label: 'MTN MoMo', icon: '📱' },
  { key: 'airtel', label: 'Airtel Money', icon: '📡' },
  { key: 'manual', label: 'Manual/Cash', icon: '💵' },
];

export default function FundWalletScreen() {
  const router = useRouter();
  const { summary, fundWallet } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('mtn');
  const [walletType, setWalletType] = useState<'personal' | 'household'>('personal');
  const [isLoading, setIsLoading] = useState(false);

  const personalWalletId = summary?.personal?.id;
  const householdWallet = summary?.households?.[0]?.wallet;
  const selectedWalletId = walletType === 'personal' ? personalWalletId : householdWallet?.id;

  const handleFund = async () => {
    if (!amount || Number(amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid amount' });
      return;
    }
    if (!selectedWalletId) {
      Toast.show({ type: 'error', text1: 'Wallet not found' });
      return;
    }

    setIsLoading(true);
    try {
      await fundWallet(selectedWalletId, Number(amount), source);
      Toast.show({
        type: 'success',
        text1: '💰 Wallet funded!',
        text2: `UGX ${Number(amount).toLocaleString()} added to your ${walletType} wallet`,
      });
      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Wallet Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Fund Wallet</Text>
        <View style={styles.walletRow}>
          <TouchableOpacity
            style={[styles.walletCard, walletType === 'personal' && styles.walletCardActive]}
            onPress={() => setWalletType('personal')}
          >
            <Text style={styles.walletIcon}>👤</Text>
            <Text style={styles.walletName}>Personal</Text>
            <Text style={styles.walletBalance}>UGX {Number(summary?.personal?.balance || 0).toLocaleString()}</Text>
          </TouchableOpacity>
          {householdWallet && (
            <TouchableOpacity
              style={[styles.walletCard, walletType === 'household' && styles.walletCardActive]}
              onPress={() => setWalletType('household')}
            >
              <Text style={styles.walletIcon}>🏠</Text>
              <Text style={styles.walletName}>Household</Text>
              <Text style={styles.walletBalance}>UGX {Number(householdWallet.balance).toLocaleString()}</Text>
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

      {/* Source */}
      <View style={styles.section}>
        <Text style={styles.label}>Funding Source</Text>
        {SOURCES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sourceRow, source === s.key && styles.sourceRowActive]}
            onPress={() => setSource(s.key)}
          >
            <Text style={styles.sourceIcon}>{s.icon}</Text>
            <Text style={styles.sourceLabel}>{s.label}</Text>
            <View style={[styles.radio, source === s.key && styles.radioActive]}>
              {source === s.key && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity
          style={[styles.submitBtn, (isLoading || !amount) && styles.submitBtnDisabled]}
          onPress={handleFund}
          disabled={isLoading || !amount}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              💰 Fund UGX {Number(amount || 0).toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: 20, paddingBottom: 12 },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  walletRow: { flexDirection: 'row', gap: 12 },
  walletCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: COLORS.border, gap: 6 },
  walletCardActive: { borderColor: COLORS.success, backgroundColor: COLORS.success + '10' },
  walletIcon: { fontSize: 24 },
  walletName: { fontSize: 13, color: COLORS.textSecondary },
  walletBalance: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
  amountContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, height: 72, gap: 10 },
  amountPrefix: { fontSize: 20, color: COLORS.textSecondary, fontWeight: '600' },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '800', color: COLORS.text },
  quickAmount: { backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  quickAmountText: { fontSize: 13, color: COLORS.success, fontWeight: '600' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  sourceRowActive: { borderColor: COLORS.success },
  sourceIcon: { fontSize: 22 },
  sourceLabel: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: COLORS.success },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  submitBtn: { backgroundColor: COLORS.success, borderRadius: 16, height: 60, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
