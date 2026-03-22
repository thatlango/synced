import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import { COLORS } from '../constants';

export default function BillsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newBill, setNewBill] = useState({ name: '', amount: '', dueDate: '', provider: '' });

  const { data: bills, isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => api.bills.getAll(),
    staleTime: 60000,
  });

  const markPaidMutation = useMutation({
    mutationFn: (billId: string) => api.bills.markPaid(billId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-bills'] });
      Toast.show({ type: 'success', text1: '✅ Bill marked as paid' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: err.message || 'Failed to update bill' });
    },
  });

  const allBills = Array.isArray(bills) ? bills : [];
  const unpaidBills = allBills.filter((b: any) => !b.isPaid);
  const paidBills = allBills.filter((b: any) => b.isPaid);

  const getDaysUntilDue = (dueDate: string) => {
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const getDueBadgeStyle = (days: number) => {
    if (days < 0) return { bg: COLORS.error + '20', color: COLORS.error, label: 'Overdue' };
    if (days === 0) return { bg: COLORS.error + '20', color: COLORS.error, label: 'Due today' };
    if (days <= 3) return { bg: COLORS.warning + '20', color: COLORS.warning, label: `${days}d left` };
    return { bg: COLORS.success + '20', color: COLORS.success, label: `${days}d left` };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bills Tracker</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      {!isLoading && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: COLORS.warning + '40' }]}>
            <Text style={styles.summaryNum}>{unpaidBills.length}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: COLORS.success + '40' }]}>
            <Text style={[styles.summaryNum, { color: COLORS.success }]}>{paidBills.length}</Text>
            <Text style={styles.summaryLabel}>Paid</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: COLORS.primary + '40' }]}>
            <Text style={[styles.summaryNum, { color: COLORS.primary }]}>
              {unpaidBills.reduce((s: number, b: any) => s + Number(b.amount), 0).toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>UGX Due</Text>
          </View>
        </View>
      )}

      {isLoading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />}

      {/* Unpaid Bills */}
      {unpaidBills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming & Overdue</Text>
          {unpaidBills.map((bill: any) => {
            const days = getDaysUntilDue(bill.dueDate);
            const badge = getDueBadgeStyle(days);
            return (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.billLeft}>
                  <Text style={styles.billName}>{bill.name}</Text>
                  {bill.provider && <Text style={styles.billProvider}>{bill.provider}</Text>}
                  <Text style={styles.billDue}>Due: {new Date(bill.dueDate).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={styles.billRight}>
                  <Text style={styles.billAmount}>UGX {Number(bill.amount).toLocaleString()}</Text>
                  <View style={[styles.dueBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.dueBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.markPaidBtn}
                    onPress={() => markPaidMutation.mutate(bill.id)}
                    disabled={markPaidMutation.isPending}
                  >
                    {markPaidMutation.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.markPaidText}>Mark Paid</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Paid Bills */}
      {paidBills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paid</Text>
          {paidBills.map((bill: any) => (
            <View key={bill.id} style={[styles.billCard, styles.billCardPaid]}>
              <View style={styles.billLeft}>
                <Text style={[styles.billName, { color: COLORS.textMuted }]}>{bill.name}</Text>
                {bill.provider && <Text style={styles.billProvider}>{bill.provider}</Text>}
              </View>
              <View style={styles.billRight}>
                <Text style={[styles.billAmount, { color: COLORS.textMuted }]}>UGX {Number(bill.amount).toLocaleString()}</Text>
                <Text style={styles.paidBadge}>✓ Paid</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {!isLoading && allBills.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No bills yet</Text>
          <Text style={styles.emptySubtitle}>Add your recurring bills to track due dates</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.emptyAddText}>Add a Bill</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Bill Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Bill</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Bill Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., NWSC Water, UEDCL Power"
                placeholderTextColor={COLORS.textMuted}
                value={newBill.name}
                onChangeText={(v) => setNewBill((p) => ({ ...p, name: v }))}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Provider (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., NWSC, UEDCL, DSTV"
                placeholderTextColor={COLORS.textMuted}
                value={newBill.provider}
                onChangeText={(v) => setNewBill((p) => ({ ...p, provider: v }))}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Amount (UGX)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={newBill.amount}
                onChangeText={(v) => setNewBill((p) => ({ ...p, amount: v }))}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-12-31"
                placeholderTextColor={COLORS.textMuted}
                value={newBill.dueDate}
                onChangeText={(v) => setNewBill((p) => ({ ...p, dueDate: v }))}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdd(false); setNewBill({ name: '', amount: '', dueDate: '', provider: '' }); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!newBill.name || !newBill.amount || !newBill.dueDate) && styles.saveBtnDisabled]}
                disabled={!newBill.name || !newBill.amount || !newBill.dueDate}
                onPress={async () => {
                  try {
                    await api.bills.create({
                      name: newBill.name,
                      amount: Number(newBill.amount),
                      dueDate: new Date(newBill.dueDate).toISOString(),
                      provider: newBill.provider || undefined,
                    });
                    queryClient.invalidateQueries({ queryKey: ['bills'] });
                    queryClient.invalidateQueries({ queryKey: ['upcoming-bills'] });
                    setShowAdd(false);
                    setNewBill({ name: '', amount: '', dueDate: '', provider: '' });
                    Toast.show({ type: 'success', text1: '✅ Bill added' });
                  } catch (err: any) {
                    Toast.show({ type: 'error', text1: err.message });
                  }
                }}
              >
                <Text style={styles.saveText}>Save Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12 },
  backBtn: { marginRight: 12 },
  backIcon: { fontSize: 32, color: COLORS.text, lineHeight: 36 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary + '20', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.primary + '40' },
  addBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  summaryNum: { fontSize: 20, fontWeight: '800', color: COLORS.warning },
  summaryLabel: { fontSize: 11, color: COLORS.textMuted },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  billCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  billCardPaid: { opacity: 0.6 },
  billLeft: { flex: 1, gap: 3 },
  billName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  billProvider: { fontSize: 12, color: COLORS.textMuted },
  billDue: { fontSize: 12, color: COLORS.warning, marginTop: 4 },
  billRight: { alignItems: 'flex-end', gap: 8 },
  billAmount: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  dueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dueBadgeText: { fontSize: 11, fontWeight: '600' },
  markPaidBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  markPaidText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  paidBadge: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyAddBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  emptyAddText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  input: { backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, height: 52, color: COLORS.text, fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.border },
  cancelText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
  saveBtn: { flex: 2, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
