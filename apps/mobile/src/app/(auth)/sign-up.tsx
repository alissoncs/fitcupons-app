import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { api } from '@/lib/api';
import { isHttpError } from '@/lib/errors';
import { passwordStrength } from '@/lib/sport-icon';
import { useSessionStore } from '@/store/session';
import { useTheme } from '@/theme';

export default function SignUpScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const applyTokens = useSessionStore((state) => state.applyTokens);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(password);

  async function onSubmit() {
    setError(null);
    if (!accepted) {
      setError('Aceite os termos para criar a conta.');
      return;
    }
    if (password.length < 8) {
      setError('A senha precisa ter no mínimo 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const tokens = await api.registerEmail(name.trim(), email.trim(), password);
      const me = await applyTokens(tokens);
      if (me.onboarded) router.replace('/(tabs)');
      else router.replace('/onboarding/sports');
    } catch (err) {
      setError(isHttpError(err) ? err.message : 'Não deu para criar a conta. Tente de novo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, backgroundColor: theme.bg },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.ink }]}>Criar conta</Text>
      <Text style={[styles.sub, { color: theme.inkMuted }]}>Entra direto no app. A confirmação do e-mail roda em paralelo.</Text>
      <TextField label="Nome" value={name} onChangeText={setName} autoCapitalize="words" />
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField label="Senha" value={password} onChangeText={setPassword} password />
      {password ? (
        <View style={styles.strength}>
          <View style={styles.bars}>
            {[1, 2, 3, 4].map((step) => (
              <View
                key={step}
                style={[
                  styles.bar,
                  {
                    backgroundColor:
                      strength.score >= step ? (strength.score >= 3 ? theme.accent : theme.amber) : theme.border,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: theme.inkMuted }]}>{strength.label}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        accessibilityLabel="Aceito os termos de uso"
        onPress={() => setAccepted((value) => !value)}
        style={styles.terms}
      >
        <MaterialCommunityIcons
          name={accepted ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={accepted ? theme.primary : theme.inkMuted}
        />
        <Text style={[styles.termsText, { color: theme.ink }]}>Li e aceito os termos de uso e a política de privacidade.</Text>
      </Pressable>

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button label="Criar conta" onPress={onSubmit} loading={loading} disabled={!accepted} />
      <Link href="/(auth)/sign-in" asChild>
        <Pressable accessibilityRole="link">
          <Text style={[styles.link, { color: theme.primary }]}>Já tenho conta</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 14 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 4 },
  strength: { gap: 6 },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600' },
  terms: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  termsText: { flex: 1, fontSize: 14, lineHeight: 20 },
  error: { fontSize: 13, fontWeight: '600' },
  link: { textAlign: 'center', fontSize: 15, fontWeight: '600', minHeight: 44 },
});
