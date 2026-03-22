import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Logo & Branding */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <Text style={styles.appName}>Synced</Text>
        <Text style={styles.tagline}>Shared Financial Intelligence</Text>
        <Text style={styles.brand}>by TukuTuku Innovation Labs</Text>
      </View>

      {/* Features Preview */}
      <View style={styles.featuresSection}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* CTA Buttons */}
      <View style={styles.buttonsSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/auth/signup')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>

        {/* Demo Mode */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.demoButtonText}>
            🎯 Demo: +256700000001 | OTP: 123456
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const FEATURES = [
  { icon: '👨‍👩‍👧‍👦', text: 'Sync finances with your household' },
  { icon: '📊', text: 'Track who spent what, instantly' },
  { icon: '🔮', text: 'AI-powered spending forecasts' },
  { icon: '⚡', text: 'Pay bills directly from the app' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary + '15',
    top: -100,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.secondary + '10',
    bottom: 100,
    left: -60,
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoIcon: { fontSize: 36 },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  brand: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  featuresSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIcon: { fontSize: 24 },
  featureText: { fontSize: 15, color: COLORS.text, flex: 1 },
  buttonsSection: {
    gap: 12,
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  demoButton: {
    padding: 12,
    alignItems: 'center',
  },
  demoButtonText: { color: COLORS.textMuted, fontSize: 12 },
});
