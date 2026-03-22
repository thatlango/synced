import { create } from 'zustand';
import { Household, HouseholdFinancialSummary } from '../types';
import api from '../services/api';

interface HouseholdState {
  households: Household[];
  activeHousehold: Household | null;
  financialSummary: HouseholdFinancialSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchMyHouseholds: () => Promise<void>;
  setActiveHousehold: (household: Household) => void;
  fetchFinancialSummary: (id: string) => Promise<void>;
  createHousehold: (name: string) => Promise<Household>;
  joinHousehold: (inviteCode: string) => Promise<void>;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  households: [],
  activeHousehold: null,
  financialSummary: null,
  isLoading: false,
  error: null,

  fetchMyHouseholds: async () => {
    set({ isLoading: true, error: null });
    try {
      const households: any = await api.households.getMine();
      set({ households, activeHousehold: households[0] || null });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveHousehold: (household) => set({ activeHousehold: household }),

  fetchFinancialSummary: async (id) => {
    try {
      const summary: any = await api.households.getFinancialSummary(id);
      set({ financialSummary: summary });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createHousehold: async (name) => {
    const household: any = await api.households.create({ name });
    set((state) => ({ households: [...state.households, household] }));
    return household;
  },

  joinHousehold: async (inviteCode) => {
    const household: any = await api.households.join(inviteCode);
    set((state) => ({ households: [...state.households, household] }));
  },
}));
