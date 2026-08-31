import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator, Share,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import { useHouseholdStore } from '../../store/householdStore';
import api from '../../services/api';
import { COLORS } from '../../constants';

export default function HouseholdScreen() {
  const { activeHousehold, fetchMyHouseholds, financialSummary, fetchFinancialSummary, createHousehold, joinHousehold } = useHouseholdStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { void fetchMyHouseholds(); }, []);
  useEffect(() => {
    if (activeHousehold?.id) void fetchFinancialSummary(activeHousehold.id);
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
      await fetchMyHouseholds();
      setShowCreateModal(false);
      setNewHouseholdName('');
    } finally { setIsLoading(false); }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setIsLoading(true);
    try {
      await joinHousehold(inviteCode.trim().toUpperCase());
      await fetchMyHouseholds();
      setShowJoinModal(false);
      setInviteCode('');
    } finally { setIsLoading(false); }
  };

  if (!activeHousehold) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyMark}><Text style={styles.emptyMarkText}>S</Text></View>
        <Text style={styles.emptyTitle}>Start a shared space</Text>
        <Text style={styles.emptySubtitle}>Create a household for shared money visibility, or join one with an invite code or QR.</Text>
        <View style={styles.emptyActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.primaryBtnText}>Create household</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowJoinModal(true)}>
            <Text style={styles.secondaryBtnText}>Join with invite code</Text>
          </TouchableOpacity>
        </View>
        <CreateModal visible={showCreateModal} value={newHouseholdName} onChange={setNewHouseholdName} onConfirm={handleCreate} onClose={() => setShowCreateModal(false)} isLoading={isLoading} />
        <JoinModal visible={showJoinModal} value={inviteCode} onChange={setInviteCode} onConfirm={handleJoin} onClose={() => setShowJoinModal(false)} isLoading={isLoading} />
      </View>
    );
  }

  const summary = financialSummary;
  const analytics = householdAnalytics as any;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.householdHeader}>
        <View style={styles.householdTopline}>
          <View style={styles.householdIcon}><Text style={styles.householdInitial}>{activeHousehold.name?.[0]?.toUpperCase() || 'S'}</Text></View>
          <View style={styles.householdIdentity}>
            <Text style={styles.eyebrow}>Shared household</Text>
            <Text style={styles.householdName}>{activeHousehold.name}</Text>
            <Text style={styles.memberCount}>{activeHousehold._count?.members || activeHousehold.members?.length || 1} members</Text>
          </View>
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInviteModal(true)}>
            <Text style={styles.inviteBtnText}>Invite</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.codeStrip}>
          <Text style={styles.codeLabel}>HOUSEHOLD CODE</Text>
          <Text style={styles.inviteCode}>{activeHousehold.inviteCode}</Text>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Household balance</Text>
        <Text style={styles.balanceAmount}>UGX {Number(activeHousehold.wallet?.balance || summary?.household?.walletBalance || 0).toLocaleString()}</Text>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceStats}>
          <View><Text style={styles.statValue}>UGX {Number(summary?.totalSpentThisMonth || 0).toLocaleString()}</Text><Text style={styles.statLabel}>Spent this month</Text></View>
          <View><Text style={styles.statValue}>{activeHousehold._count?.members || activeHousehold.members?.length || 1}</Text><Text style={styles.statLabel}>People sharing</Text></View>
        </View>
      </View>

      {summary?.memberBreakdown?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who spent what</Text>
          <Text style={styles.sectionSubtitle}>This month across the shared household wallet.</Text>
          {summary.memberBreakdown.map((member) => {
            const totalHH = summary.totalSpentThisMonth || 1;
            const pct = Math.min(100, Math.round((Number(member.totalSpent) / totalHH) * 100));
            return (
              <View key={member.userId} style={styles.memberCard}>
                <View style={styles.memberAvatar}><Text style={styles.memberInitial}>{(member.name || 'U')[0].toUpperCase()}</Text></View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberRow}><Text style={styles.memberName}>{member.name || 'Member'}</Text><Text style={styles.memberSpent}>UGX {Number(member.totalSpent).toLocaleString()}</Text></View>
                  <View style={styles.memberBarBg}><View style={[styles.memberBarFill, { width: `${pct}%` }]} /></View>
                  <Text style={styles.memberPct}>{pct}% of household spending</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {analytics?.byCategory?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by category</Text>
          {analytics.byCategory.slice(0, 5).map((cat: any) => (
            <View key={cat.category} style={styles.catRow}>
              <Text style={styles.catLabel}>{cat.category}</Text>
              <View style={styles.catBar}><View style={[styles.catFill, { width: `${Math.min(100, Number(cat.percentage || 0))}%` }]} /></View>
              <Text style={styles.catAmount}>UGX {Number(cat.amount).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {activeHousehold.members?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People</Text>
          {activeHousehold.members.map((m) => (
            <View key={m.id} style={styles.memberListItem}>
              <View style={styles.memberAvatar}><Text style={styles.memberInitial}>{(m.user?.name || 'U')[0].toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.memberName}>{m.user?.name || m.user?.phone}</Text><Text style={styles.memberRole}>{m.role}</Text></View>
              {m.user?.personalWallet ? <Text style={styles.memberBalance}>UGX {Number(m.user.personalWallet.balance).toLocaleString()}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowInviteModal(true)}><Text style={styles.actionBtnText}>Share household access</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => setShowJoinModal(true)}><Text style={styles.secondaryActionText}>Join another household</Text></TouchableOpacity>
      </View>

      <InviteModal visible={showInviteModal} householdName={activeHousehold.name} inviteCode={activeHousehold.inviteCode} onClose={() => setShowInviteModal(false)} />
      <JoinModal visible={showJoinModal} value={inviteCode} onChange={setInviteCode} onConfirm={handleJoin} onClose={() => setShowJoinModal(false)} isLoading={isLoading} />
    </ScrollView>
  );
}

function InviteModal({ visible, householdName, inviteCode, onClose }: { visible: boolean; householdName: string; inviteCode: string; onClose: () => void }) {
  const deepLink = `synced://join?code=${encodeURIComponent(inviteCode)}`;
  const share = () => Share.share({ message: `Join ${householdName} on Synced. Use code ${inviteCode} or open ${deepLink}` });
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.kicker}>SHARED BASKET ACCESS</Text>
          <Text style={modalStyles.title}>Invite someone you trust</Text>
          <Text style={modalStyles.subtitle}>This invite joins them to {householdName} and gives them the same household-level shared money view. It does not expose your private wallet.</Text>
          <View style={modalStyles.qrCard}>
            <QRCode value={deepLink} size={190} backgroundColor="#FFFFFF" color="#171A18" />
            <Text style={modalStyles.code}>{inviteCode}</Text>
            <Text style={modalStyles.helper}>Scan the QR or enter this code in Synced.</Text>
          </View>
          <TouchableOpacity style={modalStyles.button} onPress={share}><Text style={modalStyles.buttonText}>Share invite</Text></TouchableOpacity>
          <TouchableOpacity style={modalStyles.cancel} onPress={onClose}><Text style={modalStyles.cancelText}>Done</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CreateModal({ visible, value, onChange, onConfirm, onClose, isLoading }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}><View style={modalStyles.sheet}><View style={modalStyles.handle} />
        <Text style={modalStyles.title}>Create household</Text><Text style={modalStyles.subtitle}>A shared financial space for people who manage money together.</Text>
        <TextInput style={modalStyles.input} placeholder="e.g. Nakawa Family Home" placeholderTextColor={COLORS.textMuted} value={value} onChangeText={onChange} autoFocus />
        <TouchableOpacity style={modalStyles.button} onPress={onConfirm} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#fff" /> : <Text style={modalStyles.buttonText}>Create household</Text>}</TouchableOpacity>
        <TouchableOpacity style={modalStyles.cancel} onPress={onClose}><Text style={modalStyles.cancelText}>Cancel</Text></TouchableOpacity>
      </View></View>
    </Modal>
  );
}

function JoinModal({ visible, value, onChange, onConfirm, onClose, isLoading }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}><View style={modalStyles.sheet}><View style={modalStyles.handle} />
        <Text style={modalStyles.title}>Join a household</Text><Text style={modalStyles.subtitle}>Enter the invite code shared by a household admin.</Text>
        <TextInput style={[modalStyles.input, { textTransform: 'uppercase', letterSpacing: 4 }]} placeholder="NAKAWA2024" placeholderTextColor={COLORS.textMuted} value={value} onChangeText={onChange} autoCapitalize="characters" autoFocus />
        <TouchableOpacity style={modalStyles.button} onPress={onConfirm} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#fff" /> : <Text style={modalStyles.buttonText}>Join household</Text>}</TouchableOpacity>
        <TouchableOpacity style={modalStyles.cancel} onPress={onClose}><Text style={modalStyles.cancelText}>Cancel</Text></TouchableOpacity>
      </View></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, content: { paddingBottom: 40 },
  emptyContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyMark: { width: 58, height: 58, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyMarkText: { color: '#fff', fontSize: 24, fontWeight: '800' }, emptyTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 28, maxWidth: 340 }, emptyActions: { width: '100%', gap: 10 },
  primaryBtn: { minHeight: 54, backgroundColor: COLORS.primary, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { minHeight: 54, backgroundColor: COLORS.surface, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border }, secondaryBtnText: { color: COLORS.text, fontSize: 15, fontWeight: '650' },
  householdHeader: { backgroundColor: COLORS.surface, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }, householdTopline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  householdIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.primary + '18', alignItems: 'center', justifyContent: 'center' }, householdInitial: { fontSize: 20, fontWeight: '800', color: COLORS.primary }, householdIdentity: { flex: 1 },
  eyebrow: { fontSize: 10, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }, householdName: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 2 }, memberCount: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  inviteBtn: { minHeight: 42, paddingHorizontal: 16, borderRadius: 13, backgroundColor: COLORS.primary, justifyContent: 'center' }, inviteBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  codeStrip: { marginTop: 16, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, codeLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 1 }, inviteCode: { fontSize: 14, color: COLORS.primary, fontWeight: '800', letterSpacing: 1.8 },
  balanceCard: { margin: 16, backgroundColor: COLORS.primary, borderRadius: 20, padding: 20 }, balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,.72)' }, balanceAmount: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 4 }, balanceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,.16)', marginVertical: 16 }, balanceStats: { flexDirection: 'row', gap: 30 }, statValue: { fontSize: 15, fontWeight: '700', color: '#fff' }, statLabel: { fontSize: 10, color: 'rgba(255,255,255,.68)', marginTop: 2 },
  section: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }, sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 3 }, sectionSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 11 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 11 }, memberAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' }, memberInitial: { fontSize: 16, fontWeight: '800', color: COLORS.primary }, memberInfo: { flex: 1 }, memberRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 6 }, memberName: { fontSize: 13, fontWeight: '700', color: COLORS.text }, memberSpent: { fontSize: 13, fontWeight: '700', color: COLORS.text }, memberBarBg: { height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }, memberBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 }, memberPct: { fontSize: 10, color: COLORS.textMuted },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 11, gap: 9 }, catLabel: { width: 76, fontSize: 11, color: COLORS.textSecondary, textTransform: 'capitalize' }, catBar: { flex: 1, height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' }, catFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 }, catAmount: { width: 84, fontSize: 10, color: COLORS.textSecondary, textAlign: 'right' },
  memberListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 13, padding: 12, marginBottom: 8, gap: 11, borderWidth: 1, borderColor: COLORS.border }, memberRole: { fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize', marginTop: 2 }, memberBalance: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '650' },
  actionBtn: { minHeight: 52, backgroundColor: COLORS.primary + '12', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary + '30' }, actionBtnText: { color: COLORS.primary, fontWeight: '750', fontSize: 14 }, secondaryActionBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 }, secondaryActionText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '650' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(12,16,13,.44)', justifyContent: 'flex-end' }, sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30, gap: 13 }, handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 4 }, kicker: { fontSize: 9, fontWeight: '800', letterSpacing: 1.3, color: COLORS.primary }, title: { fontSize: 21, fontWeight: '800', color: COLORS.text }, subtitle: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary }, input: { backgroundColor: COLORS.background, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, height: 56, color: COLORS.text, fontSize: 16 }, button: { backgroundColor: COLORS.primary, borderRadius: 14, minHeight: 54, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#fff', fontSize: 15, fontWeight: '750' }, cancel: { alignItems: 'center', padding: 10 }, cancelText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' }, qrCard: { alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 20, marginVertical: 4 }, code: { color: COLORS.text, fontWeight: '800', fontSize: 17, letterSpacing: 2.4, marginTop: 14 }, helper: { color: COLORS.textMuted, fontSize: 11, marginTop: 5, textAlign: 'center' },
});
