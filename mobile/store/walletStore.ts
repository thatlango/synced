import { create } from 'zustand';
import { WalletSummary, Wallet } from '../types';
import api from '../services/api';

interface WalletState {
  summary: WalletSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchSummary: () => Promise<void>;
  fundWallet: (walletId: string, amount: number, source?: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary: any = await api.wallets.getSummary();
      set({ summary });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fundWallet: async (walletId, amount, source = 'manual') => {
    await api.wallets.fund(walletId, { amount, source });
    const summary: any = await api.wallets.getSummary();
    set({ summary });
  },
}));
