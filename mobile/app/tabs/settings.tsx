import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/welcome');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profilePhone}>{user?.phone}</Text>
          {user?.email && <Text style={styles.profileEmail}>{user.email}</Text>}
        </View>
      </View>

      {/* Settings Sections */}
      <SettingsSection title="Account">
        <SettingsItem icon="👤" label="Edit Profile" onPress={() => {}} />
        <SettingsItem icon="🔔" label="Notifications" onPress={() => {}} />
        <SettingsItem icon="🔒" label="Privacy & Security" onPress={() => {}} />
      </SettingsSection>

      <SettingsSection title="Finance">
        <SettingsItem icon="💱" label="Currency" subtitle="UGX" onPress={() => {}} />
        <SettingsItem icon="📊" label="Budget Periods" onPress={() => {}} />
        <SettingsItem icon="🔄" label="Sync Mobile Money" onPress={() => {}} />
      </SettingsSection>

      <SettingsSection title="Household">
        <SettingsItem icon="🏠" label="Manage Households" onPress={() => router.push('/tabs/household')} />
        <SettingsItem icon="🔗" label="My Invite Code" onPress={() => {}} />
      </SettingsSection>

      <SettingsSection title="Support">
        <SettingsItem icon="❓" label="Help & FAQ" onPress={() => {}} />
        <SettingsItem icon="📧" label="Contact Support" onPress={() => {}} />
        <SettingsItem icon="ℹ️" label="About Synced" subtitle="v1.0.0 by TukuTuku" onPress={() => {}} />
      </SettingsSection>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Synced by TukuTuku Innovation Labs</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingsSection}>
      <Text style={styles.settingsSectionTitle}>{title}</Text>
      <View style={styles.settingsCard}>{children}</View>
    </View>
  );
}

function SettingsItem({ icon, label, subtitle, onPress }: {
  icon: string; label: string; subtitle?: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.settingsChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  profilePhone: { fontSize: 14, color: COLORS.textSecondary },
  profileEmail: { fontSize: 13, color: COLORS.textMuted },
  settingsSection: { paddingHorizontal: 16, marginBottom: 20 },
  settingsSectionTitle: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  settingsCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingsIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  settingsItemContent: { flex: 1 },
  settingsLabel: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  settingsSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  settingsChevron: { fontSize: 20, color: COLORS.textMuted, fontWeight: '300' },
  logoutButton: { marginHorizontal: 16, backgroundColor: COLORS.error + '15', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: COLORS.error + '30', marginBottom: 20 },
  logoutText: { color: COLORS.error, fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', paddingBottom: 40, gap: 4 },
  footerText: { fontSize: 13, color: COLORS.textMuted },
  footerVersion: { fontSize: 12, color: COLORS.textMuted },
});
