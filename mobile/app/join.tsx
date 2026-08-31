import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useHouseholdStore } from '../store/householdStore';
import { COLORS } from '../constants';

type State = 'ready' | 'joining' | 'success' | 'error';

export default function JoinHouseholdDeepLink() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { joinHousehold, fetchMyHouseholds } = useHouseholdStore();
  const [state, setState] = useState<State>('ready');
  const [message, setMessage] = useState('');
  const code = useMemo(() => {
    const value = Array.isArray(params.code) ? params.code[0] : params.code;
    return String(value || '').trim().toUpperCase();
  }, [params.code]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !code || state !== 'ready') return;
    setState('joining');
    void joinHousehold(code)
      .then(async () => {
        await fetchMyHouseholds();
        setState('success');
        setMessage('Household joined. Your shared space is ready.');
      })
      .catch((error: any) => {
        setState('error');
        setMessage(error?.message || 'This invite could not be joined. Check that the code is still valid.');
      });
  }, [authLoading, isAuthenticated, code, state, joinHousehold, fetchMyHouseholds]);

  if (authLoading) {
    return <View style={styles.screen}><ActivityIndicator color={COLORS.primary} /><Text style={styles.helper}>Checking your Synced account…</Text></View>;
  }

  if (!code) {
    return <StateCard title="Invite code missing" body="This QR does not contain a valid Synced household invite." action="Open Synced" onPress={() => router.replace('/')} />;
  }

  if (!isAuthenticated) {
    return (
      <StateCard
        title="Sign in to join"
        body={`Invite ${code} is ready. Sign in to Synced, then open or scan this QR again to join the household.`}
        action="Sign in"
        onPress={() => router.push('/auth/login')}
        secondary="Back"
        onSecondary={() => router.replace('/')}
      />
    );
  }

  if (state === 'joining') {
    return <View style={styles.screen}><ActivityIndicator color={COLORS.primary} size="large" /><Text style={styles.title}>Joining household…</Text><Text style={styles.helper}>Using invite {code}</Text></View>;
  }

  if (state === 'success') {
    return <StateCard title="You’re in" body={message} action="Open shared household" onPress={() => router.replace('/tabs/household')} />;
  }

  if (state === 'error') {
    return <StateCard title="Couldn’t join" body={message} action="Try again" onPress={() => setState('ready')} secondary="Open households" onSecondary={() => router.replace('/tabs/household')} />;
  }

  return <View style={styles.screen}><ActivityIndicator color={COLORS.primary} /></View>;
}

function StateCard({ title, body, action, onPress, secondary, onSecondary }: { title: string; body: string; action: string; onPress: () => void; secondary?: string; onSecondary?: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.mark}><Text style={styles.markText}>S</Text></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <TouchableOpacity style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{action}</Text></TouchableOpacity>
      {secondary && onSecondary ? <TouchableOpacity style={styles.secondary} onPress={onSecondary}><Text style={styles.secondaryText}>{secondary}</Text></TouchableOpacity> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 28 },
  mark: { width: 58, height: 58, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  markText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  body: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 360, marginTop: 9, marginBottom: 24 },
  helper: { color: COLORS.textMuted, fontSize: 12, marginTop: 12, textAlign: 'center' },
  button: { width: '100%', maxWidth: 360, minHeight: 54, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondary: { minHeight: 46, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});
