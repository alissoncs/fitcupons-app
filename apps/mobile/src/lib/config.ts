import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extra?.apiUrl ?? 'http://localhost:3000';

export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export type ClientDataMode = 'auto' | 'mock' | 'live';

export function getClientDataMode(): ClientDataMode {
  const raw = (process.env.EXPO_PUBLIC_USE_MOCK ?? 'auto').trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'mock') return 'mock';
  if (raw === 'false' || raw === '0' || raw === 'live') return 'live';
  return 'auto';
}

export const HEALTH_TIMEOUT_MS = 1200;
export const DEFAULT_TIMEOUT_MS = 20_000;
