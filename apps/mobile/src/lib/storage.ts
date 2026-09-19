import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'fitcupons.accessToken';
const REFRESH_KEY = 'fitcupons.refreshToken';
const DEVICE_KEY = 'fitcupons.deviceId';
const SEARCH_KEY = 'fitcupons.recentSearches';

const memory = new Map<string, string>();

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function getItem(key: string): Promise<string | null> {
  if (!(await canUseSecureStore())) {
    return memory.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (!(await canUseSecureStore())) {
    memory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (!(await canUseSecureStore())) {
    memory.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([setItem(ACCESS_KEY, accessToken), setItem(REFRESH_KEY, refreshToken)]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([deleteItem(ACCESS_KEY), deleteItem(REFRESH_KEY)]);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  await setItem(DEVICE_KEY, id);
  return id;
}

export async function getRecentSearches(): Promise<string[]> {
  const raw = await getItem(SEARCH_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export async function setRecentSearches(items: string[]): Promise<void> {
  await setItem(SEARCH_KEY, JSON.stringify(items.slice(0, 8)));
}
