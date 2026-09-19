import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { api } from '@/lib/api';
import { useTheme } from '@/theme';

const CONFIRMATION = 'Se houver uma conta com esse e-mail, enviamos o link.';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
    } catch {
      // Same confirmation either way.
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <View style={[styles.box, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.ink }]}>Esqueci minha senha</Text>
      <Text style={[styles.sub, { color: theme.inkMuted }]}>
        Digite o e-mail da conta. Se ele existir, você recebe o link para criar uma nova senha.
      </Text>
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Button label="Enviar link" onPress={onSubmit} loading={loading} disabled={!email.trim()} />
      {sent ? <Text style={[styles.ok, { color: theme.accent }]}>{CONFIRMATION}</Text> : null}
      <Link href="/(auth)/sign-in" asChild>
        <Pressable accessibilityRole="link">
          <Text style={[styles.link, { color: theme.primary }]}>Voltar ao login</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, paddingHorizontal: 24, gap: 14 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 15, lineHeight: 22 },
  ok: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  link: { fontSize: 15, fontWeight: '600', minHeight: 44 },
});
