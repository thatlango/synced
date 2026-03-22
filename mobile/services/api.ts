import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor - attach JWT
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - unwrap data
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (response.data?.success !== undefined) {
          return response.data.data;
        }
        return response.data;
      },
      (error) => {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Network error';
        return Promise.reject(new Error(message));
      },
    );
  }

  // Auth
  auth = {
    sendOtp: (phone: string) => this.client.post('/auth/otp/send', { phone }),
    signUp: (data: { phone: string; code: string; name?: string; email?: string; platform?: string }) =>
      this.client.post('/auth/signup', data),
    login: (data: { phone: string; code: string }) => this.client.post('/auth/login', data),
    getMe: () => this.client.get('/auth/me'),
  };

  // Users
  users = {
    getProfile: () => this.client.get('/users/profile'),
    update: (data: any) => this.client.patch('/users/profile', data),
  };

  // Households
  households = {
    create: (data: any) => this.client.post('/households', data),
    join: (inviteCode: string) => this.client.post('/households/join', { inviteCode }),
    getMine: () => this.client.get('/households/mine'),
    getById: (id: string) => this.client.get(`/households/${id}`),
    getFinancialSummary: (id: string) => this.client.get(`/households/${id}/financial-summary`),
    update: (id: string, data: any) => this.client.patch(`/households/${id}`, data),
    leave: (id: string) => this.client.delete(`/households/${id}/leave`),
  };

  // Wallets
  wallets = {
    getSummary: () => this.client.get('/wallets/summary'),
    getPersonal: () => this.client.get('/wallets/personal'),
    getHousehold: (householdId: string) => this.client.get(`/wallets/household/${householdId}`),
    fund: (walletId: string, data: any) => this.client.post(`/wallets/${walletId}/fund`, data),
    getLedger: (walletId: string, page?: number) =>
      this.client.get(`/wallets/${walletId}/ledger`, { params: { page } }),
  };

  // Transactions
  transactions = {
    create: (data: any) => this.client.post('/transactions', data),
    getAll: (params?: any) => this.client.get('/transactions', { params }),
    getById: (id: string) => this.client.get(`/transactions/${id}`),
    getSummary: (period?: string) => this.client.get('/transactions/summary', { params: { period } }),
  };

  // Subscriptions
  subscriptions = {
    create: (data: any) => this.client.post('/subscriptions', data),
    getAll: () => this.client.get('/subscriptions'),
    getUpcoming: (days?: number) => this.client.get('/subscriptions/upcoming', { params: { days } }),
    update: (id: string, data: any) => this.client.patch(`/subscriptions/${id}`, data),
    cancel: (id: string) => this.client.delete(`/subscriptions/${id}`),
  };

  // Bills
  bills = {
    create: (data: any) => this.client.post('/bills', data),
    getAll: (includePaid = true) => this.client.get('/bills', { params: { includePaid } }),
    getUpcoming: (days?: number) => this.client.get('/bills/upcoming', { params: { days } }),
    markPaid: (id: string) => this.client.patch(`/bills/${id}/mark-paid`),
  };

  // Payments
  payments = {
    payBill: (data: any) => this.client.post('/payments/pay-bill', data),
    directPayment: (data: any) => this.client.post('/payments/direct', data),
    getHistory: (page?: number) => this.client.get('/payments/history', { params: { page } }),
  };

  // Budgets
  budgets = {
    create: (data: any) => this.client.post('/budgets', data),
    getAll: () => this.client.get('/budgets'),
    delete: (id: string) => this.client.delete(`/budgets/${id}`),
  };

  // Forecasts
  forecasts = {
    personal: () => this.client.get('/forecasts/personal'),
    household: (householdId: string) => this.client.get(`/forecasts/household/${householdId}`),
  };

  // Analytics
  analytics = {
    personal: () => this.client.get('/analytics/personal'),
    trends: (months?: number) => this.client.get('/analytics/personal/trends', { params: { months } }),
    household: (householdId: string) => this.client.get(`/analytics/household/${householdId}`),
  };

  // Alerts
  alerts = {
    getAll: (status?: string) => this.client.get('/alerts', { params: { status } }),
    getUnreadCount: () => this.client.get('/alerts/unread-count'),
    markRead: (id: string) => this.client.patch(`/alerts/${id}/read`),
    markAllRead: () => this.client.patch('/alerts/read-all'),
    check: () => this.client.post('/alerts/check'),
  };

  // Search
  search = {
    global: (q: string, limit?: number) => this.client.get('/search', { params: { q, limit } }),
  };

  // Ingestion
  ingestion = {
    sms: (walletId: string, smsBody: string) => this.client.post('/ingestion/sms', { walletId, smsBody }),
    smsBulk: (walletId: string, smsBodies: string[]) =>
      this.client.post('/ingestion/sms/bulk', { walletId, smsBodies }),
    smsPreview: (walletId: string, smsBody: string) =>
      this.client.post('/ingestion/sms/preview', { walletId, smsBody }),
    syncMtn: (walletId: string) => this.client.post('/ingestion/mtn/sync', { walletId }),
    syncAirtel: (walletId: string) => this.client.post('/ingestion/airtel/sync', { walletId }),
  };
}

export const api = new ApiService();
export default api;
