import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  sendOtp: (phone: string) => Promise<{ otp?: string }>;
  signUp: (data: { phone: string; code: string; name?: string; email?: string }) => Promise<void>;
  login: (data: { phone: string; code: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  clearError: () => set({ error: null }),

  sendOtp: async (phone) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.auth.sendOtp(phone);
      return result;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result: any = await api.auth.signUp(data);
      await SecureStore.setItemAsync('access_token', result.accessToken);
      set({ user: result.user, token: result.accessToken, isAuthenticated: true });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result: any = await api.auth.login(data);
      await SecureStore.setItemAsync('access_token', result.accessToken);
      set({ user: result.user, token: result.accessToken, isAuthenticated: true });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        set({ token, isAuthenticated: true });
        const user: any = await api.auth.getMe();
        set({ user });
      }
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      set({ isAuthenticated: false });
    }
  },

  refreshProfile: async () => {
    try {
      const user: any = await api.auth.getMe();
      set({ user });
    } catch (err) {
      console.warn('Failed to refresh profile');
    }
  },
}));
