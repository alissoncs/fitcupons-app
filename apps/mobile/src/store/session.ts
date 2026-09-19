import { create } from 'zustand';
import type { AuthTokens, MeResponse } from '@fitcupons/shared';

import { api } from '@/lib/api';
import { detectApiMode, getApiMode, setOnSessionCleared, type ApiMode } from '@/lib/http';
import { queryClient } from '@/lib/query';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/storage';

type SessionState = {
  hydrated: boolean;
  meLoading: boolean;
  accessToken: string | null;
  me: MeResponse | null;
  mode: ApiMode;
  offline: boolean;
  hydrate: () => Promise<void>;
  applyTokens: (tokens: AuthTokens) => Promise<MeResponse>;
  refreshMe: () => Promise<MeResponse | null>;
  setMe: (me: MeResponse) => void;
  signOut: () => Promise<void>;
  setOffline: (offline: boolean) => void;
};

async function loadMe(): Promise<MeResponse | null> {
  try {
    return await api.me();
  } catch {
    return null;
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  hydrated: false,
  meLoading: false,
  accessToken: null,
  me: null,
  mode: 'unknown',
  offline: false,

  hydrate: async () => {
    setOnSessionCleared(() => {
      set({ accessToken: null, me: null });
      queryClient.clear();
    });

    const detected = await detectApiMode();
    const accessToken = await getAccessToken();
    set({ mode: detected, accessToken, meLoading: Boolean(accessToken) });

    if (!accessToken) {
      set({ hydrated: true, meLoading: false, me: null });
      return;
    }

    const me = await loadMe();
    if (!me) {
      await clearTokens();
      set({ accessToken: null, me: null, hydrated: true, meLoading: false });
      return;
    }

    set({ me, hydrated: true, meLoading: false, offline: false });
  },

  applyTokens: async (tokens) => {
    await setTokens(tokens.accessToken, tokens.refreshToken);
    set({ accessToken: tokens.accessToken, meLoading: true });
    const me = await api.me();
    set({ me, meLoading: false });
    return me;
  },

  refreshMe: async () => {
    if (!get().accessToken) return null;
    set({ meLoading: true });
    const me = await loadMe();
    set({ me, meLoading: false });
    return me;
  },

  setMe: (me) => set({ me }),

  signOut: async () => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) await api.logout(refreshToken);
    } catch {
      // Best-effort logout.
    }
    await clearTokens();
    queryClient.clear();
    set({ accessToken: null, me: null });
  },

  setOffline: (offline) => set({ offline }),
}));

export function useSessionReady(): boolean {
  const hydrated = useSessionStore((state) => state.hydrated);
  const accessToken = useSessionStore((state) => state.accessToken);
  const meLoading = useSessionStore((state) => state.meLoading);
  const me = useSessionStore((state) => state.me);
  if (!hydrated) return false;
  if (accessToken && meLoading && !me) return false;
  return true;
}

export function getSessionMode(): ApiMode {
  return useSessionStore.getState().mode || getApiMode();
}
