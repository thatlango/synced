import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '../../store/householdStore';
import { useWalletStore } from '../../store/walletStore';
import api from '../../services/api';
import { COLORS } from '../../constants';

export default function HouseholdScreen() {
  const { households, activeHousehold, fetchMyHouseholds, financialSummary, fetchFinancialSummary, createHousehold, joinHousehold } = useHouseholdStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMyHouseholds();
  }, []);

  useEffect(() => {
    if (activeHousehold?.id) {
      fetchFinancialSummary(activeHousehold.id);
    }
  }, [activeHousehold?.id]);

  const { data: householdAnalytics } = useQuery({
    queryKey: ['household-analytics', activeHousehold?.id],
    queryFn: () => api.analytics.household(activeHousehold!.id),
    enabled: !!activeHousehold?.id,
    staleTime: 60000,
  });

  const handleCreate = async () => {
    if (!newHouseholdName.trim()) return;
    setIsLoading(true);
    try {
      await createHousehold(newHouseholdName.trim());
      setShowCreateModal(false);
      setNewHouseholdName('');
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setIsLoading(true);
    try {
      await joinHousehold(inviteCode.trim().toUpperCase());
      setShowJoinModal(false);
      setInviteCode('');
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeHousehold) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🏠</Text>
        <Text style={styles.emptyTitle}>No Household Yet</Text>
        <Text style={styles.emptySubtitle}>Create or join a household to sync finances with your family</Text>

        <View style={styles.emptyActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.primaryBtnText}>+ Create Household</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowJoinModal(true)}>
            <Text style={styles.secondaryBtnText}>Join via Invite Code</Text>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <CreateModal
          visible={showCreateModal}
          value={newHouseholdName}
          onChange={setNewHouseholdName}
          onConfirm={handleCreate}
          onClose={() => setShowCreateModal(false)}
          isLoading={isLoading}
        />
        <JoinModal
          visible={showJoinModal}
          value={inviteCode}
          onChange={setInviteCode}
          onConfirm={handleJoin}
          onClose={() => setShowJoinModal(false)}
          isLoading={isLoading}
        />
      </View>
    );
  }

  const summary = financialSummary;
  const analytics = householdAnalytics as any;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Household Header */}
      <View style={styles.householdHeader}>
        <View style={styles.householdIcon}>
          <Text style={styles.householdEmoji}>🏠</Text>
        </View>
        <Text style={styles.householdName}>{activeHousehold.name}</Text>
        <Text style={styles.inviteCode}>Invite Code: {activeHousehold.inviteCode}</Text>
        {activeHousehold._count && (
          <Text style={styles.memberCount}>{activeHousehold._count.members} members</Text>
        )}
      </View>

      {/* Household Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Household Balance</Text>
        <Text style={styles.balanceAmount}>
          UGX {Number(activeHousehold.wallet?.balance || summary?.household?.walletBalance || 0).toLocaleString()}
        </Text>
        <View style={styles.balanceStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>UGX {Number(summary?.totalSpentThisMonth || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Spent this month</Text>
          </View>
        </View>
      </View>

      {/* Member Spending Breakdown */}
      {summary?.memberBreakdown && summary.memberBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who Spent What</Text>
          <Text style={styles.sectionSubtitle}>This month's breakdown</Text>
          {summary.memberBreakdown.map((member) => {
            const totalHH = summary.totalSpentThisMonth || 1;
            const pct = Math.round((Number(member.totalSpent) / totalHH) * 100);
            return (
              <View key={member.userId} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {(member.name || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberRow}>
                    <Text style={styles.memberName}>{member.name || 'Member'}</Text>
                    <Text style={styles.memberSpent}>UGX {Number(member.totalSpent).toLocaleString()}</Text>
                  </View>
                  <View style={styles.memberBarBg}>
                    <View style={[styles.memberBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.memberPct}>{pct}% of household spending</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Category Breakdown */}
      {analytics?.byCategory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {analytics.byCategory.slice(0, 5).map((cat: any) => (
            <View key={cat.category} style={styles.catRow}>
              <Text style={styles.catLabel}>{cat.category}</Text>
              <View style={styles.catBar}>
                <View style={[styles.catFill, { width: `${cat.percentage}%` }]} />
              </View>
              <Text style={styles.catAmount}>UGX {Number(cat.amount).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Members List */}
      {activeHousehold.members && activeHousehold.members.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          {activeHousehold.members.map((m) => (
            <View key={m.id} style={styles.memberListItem}>
              <View style={[styles.memberAvatar, { backgroundColor: COLORS.primary + '30' }]}>
                <Text style={styles.memberInitial}>{(m.user?.name || 'U')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.user?.name || m.user?.phone}</Text>
                <Text style={styles.memberRole}>{m.role}</Text>
              </View>
              {m.user?.personalWallet && (
                <Text style={styles.memberBalance}>
                  UGX {Number(m.user.personalWallet.balance).toLocaleString()}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowJoinModal(true)}>
          <Text style={styles.actionBtnText}>+ Invite Member</Text>
        </TouchableOpacity>
      </View>

      <JoinModal
        visible={showJoinModal}
        value={inviteCode}
        onChange={setInviteCode}
        onConfirm={handleJoin}
        onClose={() => setShowJoinModal(false)}
        isLoading={isLoading}
      />
    </ScrollView>
  );
}

function CreateModal({ visible, value, onChange, onConfirm, onClose, isLoading }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Create Household</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="e.g. Nakawa Family Home"
            placeholderTextColor={COLORS.textMuted}
            value={value}
            onChangeText={onChange}
            autoFocus
          />
          <TouchableOpacity style={modalStyles.button} onPress={onConfirm} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={modalStyles.buttonText}>Create</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.cancel} onPress={onClose}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function JoinModal({ visible, value, onChange, onConfirm, onClose, isLoading }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Join Household</Text>
          <Text style={modalStyles.subtitle}>Enter the invite code shared by a household admin</Text>
          <TextInput
            style={[modalStyles.input, { textTransform: 'uppercase', letterSpacing: 4 }]}
            placeholder="NAKAWA2024"
            placeholderTextColor={COLORS.textMuted}
            value={value}
            onChangeText={onChange}
            autoCapitalize="characters"
            autoFocus
          />
          <TouchableOpacity style={modalStyles.button} onPress={onConfirm} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={modalStyles.buttonText}>Join</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.cancel} onPress={onClose}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  emptyContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
  emptyActions: { width: '100%', gap: 12 },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  secondaryBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  householdHeader: { backgroundColor: COLORS.surface, padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  householdIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  householdEmoji: { fontSize: 32 },
  householdName: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  inviteCode: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
  memberCount: { fontSize: 13, color: COLORS.textMuted },
  balanceCard: { margin: 16, backgroundColor: COLORS.primary, borderRadius: 20, padding: 20 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  balanceAmount: { fontSize: 30, fontWeight: '800', color: '#fff', marginBottom: 16, marginTop: 4 },
  balanceStats: { flexDirection: 'row', gap: 24 },
  statItem: {},
  statValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  section: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  memberInfo: { flex: 1 },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  memberName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  memberSpent: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  memberBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  memberBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  memberPct: { fontSize: 11, color: COLORS.textMuted },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  catLabel: { width: 80, fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  catBar: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  catFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  catAmount: { width: 80, fontSize: 11, color: COLORS.textSecondary, textAlign: 'right' },
  memberListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  memberRole: { fontSize: 12, color: COLORS.textMuted, textTransform: 'capitalize' },
  memberBalance: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  actionBtn: { backgroundColor: COLORS.primary + '20', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '40' },
  actionBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary },
  input: { backgroundColor: COLORS.background, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, height: 56, color: COLORS.text, fontSize: 16 },
  button: { backgroundColor: COLORS.primary, borderRadius: 14, height: 56, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancel: { alignItems: 'center', padding: 12 },
  cancelText: { color: COLORS.textSecondary, fontSize: 15 },
});
