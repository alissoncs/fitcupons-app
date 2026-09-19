import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Splash } from '@/components/Splash';
import { ToastHost } from '@/components/ui/ToastHost';
import { queryClient } from '@/lib/query';
import { useSessionReady, useSessionStore } from '@/store/session';
import { ThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function Gate() {
  const ready = useSessionReady();
  const accessToken = useSessionStore((state) => state.accessToken);
  const me = useSessionStore((state) => state.me);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const root = segments[0];
    const inAuth = root === '(auth)';
    const inOnboarding = root === 'onboarding';
    const inDeepAuth = root === 'auth';

    if (!accessToken) {
      if (!inAuth && !inDeepAuth) router.replace('/(auth)/sign-in');
      return;
    }

    if (!me?.onboarded) {
      if (!inOnboarding) router.replace('/onboarding/sports');
      return;
    }

    if (inAuth || root === 'index' || root == null) {
      router.replace('/(tabs)');
    }
  }, [accessToken, me?.onboarded, ready, router, segments]);

  if (!ready) return <Splash />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="offer/[slug]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="auth" />
    </Stack>
  );
}

function ThemedStatus() {
  const theme = useTheme();
  return <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const hydrate = useSessionStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemedStatus />
          <Gate />
          <ToastHost />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
