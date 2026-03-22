import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000, gcTime: 300000 },
  },
});

export default function RootLayout() {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor="#0f0f1a" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#1a1a2e' },
              headerTintColor: '#ffffff',
              headerTitleStyle: { fontWeight: '600' },
              contentStyle: { backgroundColor: '#0f0f1a' },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
            <Stack.Screen name="auth/signup" options={{ title: 'Create Account' }} />
            <Stack.Screen name="auth/login" options={{ title: 'Sign In' }} />
            <Stack.Screen name="auth/otp" options={{ title: 'Verify Phone' }} />
            <Stack.Screen name="tabs" options={{ headerShown: false }} />
            <Stack.Screen name="add-expense" options={{ title: 'Add Expense', presentation: 'modal' }} />
            <Stack.Screen name="pay-bill" options={{ title: 'Pay Bill', presentation: 'modal' }} />
            <Stack.Screen name="fund-wallet" options={{ title: 'Fund Wallet', presentation: 'modal' }} />
            <Stack.Screen name="transaction-detail" options={{ title: 'Transaction' }} />
          </Stack>
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
