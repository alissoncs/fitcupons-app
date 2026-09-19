import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useSessionStore } from '@/store/session';
import { useTheme } from '@/theme';

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const refreshMe = useSessionStore((state) => state.refreshMe);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>(token ? 'loading' : 'error');

  useEffect(() => {
    if (!token) return;
    void api
      .verifyEmail(token)
      .then(async () => {
        await refreshMe();
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [refreshMe, token]);

  return (
    <View style={[styles.box, { backgroundColor: theme.bg, paddingTop: insets.top + 24 }]}>
      <Text style={[styles.title, { color: theme.ink }]}>
        {status === 'loading' ? 'Confirmando e-mail…' : status === 'ok' ? 'E-mail confirmado' : 'Link inválido'}
      </Text>
      <Button
        label="Ir para o app"
        onPress={() => router.replace('/(tabs)')}
        disabled={status === 'loading'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, paddingHorizontal: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '800' },
});
