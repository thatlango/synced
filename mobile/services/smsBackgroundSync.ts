/**
 * Background SMS Sync Service
 *
 * Runs periodically in the background (every 15 minutes on iOS,
 * configurable on Android). On each run it:
 *   1. Reads new SMS messages since the last sync timestamp
 *   2. Filters for MoMo/bank keywords
 *   3. Sends them to the backend for parsing and ingestion
 *   4. Shows a local notification if any transactions were imported
 *   5. Updates the last-sync timestamp
 *
 * The user only needs to grant READ_SMS once. After that the sync
 * runs automatically in the background forever (or until they revoke
 * the permission in Android Settings).
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform, PermissionsAndroid, NativeModules } from 'react-native';

const TASK_NAME = 'SYNCED_SMS_BACKGROUND_SYNC';
const LAST_SYNC_KEY = 'sms_last_sync_ts';
const WALLET_ID_KEY = 'sms_sync_wallet_id';
const SYNC_ENABLED_KEY = 'sms_sync_enabled';

const MOMO_KEYWORDS = ['ugx', 'ug shs', 'mtn momo', 'airtel money', 'received ugx', 'payment of ugx', 'you have sent'];

// ─── Helpers ──────────────────────────────────────────────────────────────

async function readNewSmsFromDevice(since: number): Promise<string[]> {
  if (Platform.OS !== 'android') return [];
  try {
    if (!NativeModules.SmsInbox) return [];
    const messages: Array<{ body: string; date: number }> =
      await NativeModules.SmsInbox.getAllSms({ maxCount: 500, since });

    return messages
      .filter(
        (m) =>
          m.date > since &&
          MOMO_KEYWORDS.some((kw) => m.body?.toLowerCase().includes(kw)),
      )
      .map((m) => m.body);
  } catch {
    return [];
  }
}

async function postToBackend(walletId: string, smsBodies: string[], token: string): Promise<number> {
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  const res = await fetch(`${BASE_URL}/ingestion/sms/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ walletId, smsBodies }),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data?.data?.ingested ?? data?.ingested ?? 0;
}

async function showImportNotification(count: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💳 Synced — Transactions Imported',
      body: `${count} new MoMo transaction${count !== 1 ? 's' : ''} auto-imported and categorized.`,
      sound: true,
    },
    trigger: null, // show immediately
  });
}

// ─── Background Task ──────────────────────────────────────────────────────

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const enabled = await SecureStore.getItemAsync(SYNC_ENABLED_KEY);
    if (enabled !== 'true') return BackgroundFetch.BackgroundFetchResult.NoData;

    const token = await SecureStore.getItemAsync('access_token');
    if (!token) return BackgroundFetch.BackgroundFetchResult.NoData;

    const walletId = await SecureStore.getItemAsync(WALLET_ID_KEY);
    if (!walletId) return BackgroundFetch.BackgroundFetchResult.NoData;

    const lastSyncRaw = await SecureStore.getItemAsync(LAST_SYNC_KEY);
    const lastSync = lastSyncRaw ? parseInt(lastSyncRaw, 10) : Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days back on first run

    const smsBodies = await readNewSmsFromDevice(lastSync);
    if (smsBodies.length === 0) {
      await SecureStore.setItemAsync(LAST_SYNC_KEY, String(Date.now()));
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const imported = await postToBackend(walletId, smsBodies, token);
    await SecureStore.setItemAsync(LAST_SYNC_KEY, String(Date.now()));

    if (imported > 0) {
      await showImportNotification(imported);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.warn('[SmsBackgroundSync] error:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Public API ───────────────────────────────────────────────────────────

export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'Read SMS Permission',
        message:
          'Synced reads your MTN MoMo and Airtel Money messages to automatically import and categorize transactions. This runs silently in the background.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function enableBackgroundSync(walletId: string): Promise<boolean> {
  const hasPermission = await requestSmsPermission();
  if (!hasPermission) return false;

  // Request notification permission for import alerts
  await Notifications.requestPermissionsAsync();

  await SecureStore.setItemAsync(SYNC_ENABLED_KEY, 'true');
  await SecureStore.setItemAsync(WALLET_ID_KEY, walletId);

  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Available ||
      status === BackgroundFetch.BackgroundFetchStatus.Restricted
    ) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,   // continue after app is closed
        startOnBoot: true,        // restart on device reboot
      });
    }
  } catch (err) {
    // Task may already be registered
    console.log('[SmsBackgroundSync] register:', err);
  }

  return true;
}

export async function disableBackgroundSync(): Promise<void> {
  await SecureStore.setItemAsync(SYNC_ENABLED_KEY, 'false');
  try {
    await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
  } catch {
    // already unregistered
  }
}

export async function isSyncEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(SYNC_ENABLED_KEY);
  return val === 'true';
}

export async function getLastSyncTime(): Promise<Date | null> {
  const ts = await SecureStore.getItemAsync(LAST_SYNC_KEY);
  return ts ? new Date(parseInt(ts, 10)) : null;
}

/** Run a manual sync right now (used from the SMS Sync screen) */
export async function runManualSync(walletId: string, token: string): Promise<number> {
  const lastSyncRaw = await SecureStore.getItemAsync(LAST_SYNC_KEY);
  const lastSync = lastSyncRaw ? parseInt(lastSyncRaw, 10) : Date.now() - 30 * 24 * 60 * 60 * 1000;

  const smsBodies = await readNewSmsFromDevice(lastSync);
  if (smsBodies.length === 0) return 0;

  const imported = await postToBackend(walletId, smsBodies, token);
  await SecureStore.setItemAsync(LAST_SYNC_KEY, String(Date.now()));
  return imported;
}
