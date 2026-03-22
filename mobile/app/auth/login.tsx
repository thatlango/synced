import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, login, isLoading } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [demoOtp, setDemoOtp] = useState('');

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Toast.show({ type: 'error', text1: 'Enter a valid phone number' });
      return;
    }
    try {
      const result: any = await sendOtp(phone);
      setStep('otp');
      if (result?.otp) setDemoOtp(result.otp);
      Toast.show({ type: 'success', text1: 'OTP sent!', text2: result?.otp ? `Demo OTP: ${result.otp}` : 'Check your phone' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    }
  };

  const handleLogin = async () => {
    if (!otp || otp.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter 6-digit OTP' });
      return;
    }
    try {
      await login({ phone, code: otp });
      router.replace('/tabs');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your Synced account</Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.form}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputRow}>
                <Text style={styles.flag}>🇺🇬 +256</Text>
                <TextInput
                  style={styles.input}
                  placeholder="700 000 000"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={15}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/auth/signup')} style={styles.link}>
                <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Enter OTP sent to {phone}</Text>
              {demoOtp ? (
                <View style={styles.demoBox}>
                  <Text style={styles.demoText}>🎯 Demo OTP: {demoOtp}</Text>
                </View>
              ) : null}
              <TextInput
                style={[styles.inputRow, styles.otpInput]}
                placeholder="● ● ● ● ● ●"
                placeholderTextColor={COLORS.textMuted}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                textAlign="center"
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('phone')} style={styles.link}>
                <Text style={styles.linkText}>← Change phone number</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', paddingVertical: 40 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  form: { gap: 16, marginTop: 24 },
  label: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
  },
  flag: { fontSize: 20, color: COLORS.text },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  otpInput: {
    justifyContent: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '700',
    color: COLORS.text,
  },
  demoBox: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  demoText: { color: COLORS.primaryLight, fontSize: 14, textAlign: 'center', fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { alignItems: 'center', padding: 8 },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  linkBold: { color: COLORS.primary, fontWeight: '700' },
});
