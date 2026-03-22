/**
 * SMS Sync Screen
 *
 * One-time permission grant → background sync runs forever.
 * Shows sync status, last sync time, and lets user manually trigger a sync.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Switch, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useWalletStore } from '../store/walletStore';
import {
  enableBackgroundSync,
  disableBackgroundSync,
  isSyncEnabled,
  getLastSyncTime,
  runManualSync,
} from '../services/smsBackgroundSync';
import { COLORS } from '../constants';

export default function SmsSyncScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { summary, fetchSummary } = useWalletStore();

  const [syncEnabled, setSyncEnabled] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [walletType, setWalletType] = useState<'personal' | 'household'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const personalWalletId = summary?.personal?.id;
  const householdWallet = summary?.households?.[0]?.wallet;
  const walletId = walletType === 'personal' ? personalWalletId : householdWallet?.id;

  useEffect(() => {
    if (!summary) fetchSummary();
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const [enabled, lastTime] = await Promise.all([isSyncEnabled(), getLastSyncTime()]);
    setSyncEnabled(enabled);
    setLastSync(lastTime);
  };

  const handleToggleSync = useCallback(async (value: boolean) => {
    if (!walletId) {
      Toast.show({ type: 'error', text1: 'Select a wallet first' });
      return;
    }
    setIsLoading(true);
    try {
      if (value) {
        const success = await enableBackgroundSync(walletId);
        if (success) {
          setSyncEnabled(true);
          setStatusMsg('Background sync enabled! Synced will now silently import MoMo transactions.');
          Toast.show({ type: 'success', text1: '✅ Background sync enabled' });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Permission denied',
            text2: 'Please allow SMS permission in your phone settings.',
          });
        }
      } else {
        await disableBackgroundSync();
        setSyncEnabled(false);
        setStatusMsg('Background sync disabled.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletId]);

  const handleManualSync = useCallback(async () => {
    if (!walletId) return;
    setIsSyncing(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) throw new Error('Not logged in');
      const imported = await runManualSync(walletId, token);
      setLastSync(new Date());
      if (imported > 0) {
        queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        await fetchSummary();
        Toast.show({ type: 'success', text1: `✅ ${imported} transaction${imported !== 1 ? 's' : ''} imported` });
      } else {
        Toast.show({ type: 'info', text1: 'No new MoMo transactions found' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Sync failed' });
    } finally {
      setIsSyncing(false);
    }
  }, [walletId]);

  const formatLastSync = (d: Date | null) => {
    if (!d) return 'Never';
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>SMS Auto-Sync</Text>
          <Text style={styles.subtitle}>MTN MoMo & Airtel Money</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: syncEnabled ? COLORS.success : COLORS.textMuted }]} />
      </View>

      {/* How it works card */}
      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>📲 How it works</Text>
        <Text style={styles.howDesc}>
          Grant SMS permission once. Synced will run silently in the background, reading your MTN MoMo and Airtel Money messages, extracting transactions, and auto-categorizing them into your wallet — even when the app is closed.
        </Text>
        <View style={styles.howSteps}>
          {[
            { icon: '🔐', text: 'Grant READ_SMS permission once' },
            { icon: '🔄', text: 'Background sync every 15 minutes' },
            { icon: '🏷️', text: 'Transactions auto-categorized' },
            { icon: '🔔', text: 'Notification when transactions are imported' },
          ].map((s) => (
            <View key={s.text} style={styles.howStep}>
              <Text style={styles.howStepIcon}>{s.icon}</Text>
              <Text style={styles.howStepText}>{s.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {Platform.OS !== 'android' && (
        <View style={styles.iosWarning}>
          <Text style={styles.iosWarningText}>
            ⚠️ Background SMS sync is Android-only. iOS does not allow apps to read SMS messages.
          </Text>
        </View>
      )}

      {/* Wallet Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sync to Wallet</Text>
        <View style={styles.walletRow}>
          <TouchableOpacity
            style={[styles.walletBtn, walletType === 'personal' && styles.walletBtnActive]}
            onPress={() => setWalletType('personal')}
          >
            <Text style={styles.walletIcon}>👤</Text>
            <Text style={styles.walletName}>Personal</Text>
            <Text style={styles.walletBal}>UGX {Number(summary?.personal?.balance || 0).toLocaleString()}</Text>
          </TouchableOpacity>
          {householdWallet && (
            <TouchableOpacity
              style={[styles.walletBtn, walletType === 'household' && styles.walletBtnActive]}
              onPress={() => setWalletType('household')}
            >
              <Text style={styles.walletIcon}>🏠</Text>
              <Text style={styles.walletName}>Household</Text>
              <Text style={styles.walletBal}>UGX {Number(householdWallet.balance).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Toggle */}
      <View style={styles.section}>
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleTitle}>Background Sync</Text>
            <Text style={styles.toggleDesc}>
              {syncEnabled
                ? '✅ Active — syncing in background'
                : 'Off — tap to enable'}
            </Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Switch
              value={syncEnabled}
              onValueChange={handleToggleSync}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#fff"
              disabled={Platform.OS !== 'android'}
            />
          )}
        </View>
        {statusMsg ? <Text style={styles.statusMsg}>{statusMsg}</Text> : null}
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sync Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last sync</Text>
            <Text style={styles.statusValue}>{formatLastSync(lastSync)}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={[styles.statusPill, { backgroundColor: syncEnabled ? COLORS.success + '20' : COLORS.border }]}>
              <Text style={[styles.statusPillText, { color: syncEnabled ? COLORS.success : COLORS.textMuted }]}>
                {syncEnabled ? '● Active' : '○ Inactive'}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Frequency</Text>
            <Text style={styles.statusValue}>Every 15 minutes</Text>
          </View>
          <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statusLabel}>Wallet</Text>
            <Text style={styles.statusValue}>{walletType === 'personal' ? '👤 Personal' : '🏠 Household'}</Text>
          </View>
        </View>
      </View>

      {/* Manual Sync */}
      {syncEnabled && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.manualSyncBtn, isSyncing && styles.manualSyncBtnDisabled]}
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.manualSyncText}>🔄 Sync Now</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.manualSyncHint}>
            Scans all new SMS since last sync and imports transactions immediately.
          </Text>
        </View>
      )}

      {/* Privacy Note */}
      <View style={styles.section}>
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔒 Privacy</Text>
          <Text style={styles.privacyText}>
            Only transaction amounts, merchants, and dates are extracted from your SMS. The raw message text is never stored or sent anywhere. All data stays on your device and your personal Synced account.
          </Text>
        </View>
      </View>

      {/* Supported formats */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Supported SMS formats</Text>
        <View style={styles.formatsCard}>
          {[
            '📱 MTN MoMo — received, sent, payments, withdrawals, airtime',
            '📱 Airtel Money — sent, received, bundles',
            '🏦 Stanbic, DFCU, Equity, Centenary Bank',
            '💬 Any SMS containing "UGX" + payment action',
          ].map((f) => (
            <Text key={f} style={styles.formatItem}>{f}</Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  backIcon: { fontSize: 32, color: COLORS.text, lineHeight: 36, marginRight: 4 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  howItWorks: { marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: COLORS.primary + '30', marginBottom: 8 },
  howTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  howDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
  howSteps: { gap: 10 },
  howStep: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  howStepIcon: { fontSize: 18, width: 26 },
  howStepText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  iosWarning: { marginHorizontal: 20, marginTop: 12, backgroundColor: COLORS.warning + '15', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.warning + '30' },
  iosWarningText: { fontSize: 13, color: COLORS.warning, lineHeight: 18 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  walletRow: { flexDirection: 'row', gap: 12 },
  walletBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', gap: 4 },
  walletBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  walletIcon: { fontSize: 22 },
  walletName: { fontSize: 12, color: COLORS.textSecondary },
  walletBal: { fontSize: 12, color: COLORS.text, fontWeight: '700' },
  toggleCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  toggleLeft: { flex: 1, marginRight: 16 },
  toggleTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  toggleDesc: { fontSize: 13, color: COLORS.textSecondary },
  statusMsg: { fontSize: 13, color: COLORS.success, marginTop: 10, lineHeight: 18 },
  statusCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statusLabel: { fontSize: 14, color: COLORS.textSecondary },
  statusValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '600' },
  manualSyncBtn: { backgroundColor: COLORS.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  manualSyncBtnDisabled: { opacity: 0.5 },
  manualSyncText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  manualSyncHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, textAlign: 'center' },
  privacyCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  privacyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  privacyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  formatsCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: COLORS.border },
  formatItem: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
});
