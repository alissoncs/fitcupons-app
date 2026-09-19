import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { api } from '@/lib/api';
import { showToast } from '@/store/toast';
import { useTheme } from '@/theme';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!token || password.length < 8) {
      showToast('Informe uma senha com no mínimo 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      showToast('Senha redefinida. Entre de novo.');
      router.replace('/(auth)/sign-in');
    } catch {
      showToast('Não deu para redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.box, { backgroundColor: theme.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={[styles.title, { color: theme.ink }]}>Nova senha</Text>
      <TextField label="Senha" value={password} onChangeText={setPassword} password />
      <Button label="Salvar senha" onPress={onSubmit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, paddingHorizontal: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '800' },
});
