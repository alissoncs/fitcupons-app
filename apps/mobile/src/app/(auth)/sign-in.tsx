import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { GoogleButton } from '@/components/GoogleButton';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@/lib/config';
import { api } from '@/lib/api';
import { getApiMode } from '@/lib/http';
import { useSessionStore } from '@/store/session';
import { useTheme } from '@/theme';

function isUserCancel(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code) : '';
  return code === 'ERR_REQUEST_CANCELED' || code === 'SIGN_IN_CANCELLED';
}

let googleConfigured = false;
function ensureGoogle() {
  if (googleConfigured) return;
  if (!GOOGLE_IOS_CLIENT_ID && !GOOGLE_WEB_CLIENT_ID) {
    throw new Error('GOOGLE_NOT_CONFIGURED');
  }
  googleConfigured = true;
  GoogleSignin.configure({
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  void GOOGLE_ANDROID_CLIENT_ID;
}

export default function SignInScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const applyTokens = useSessionStore((state) => state.applyTokens);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finish(tokens: Awaited<ReturnType<typeof api.loginEmail>>) {
    const me = await applyTokens(tokens);
    if (me.onboarded) router.replace('/(tabs)');
    else router.replace('/onboarding/sports');
  }

  async function onEmail() {
    setError(null);
    setLoading(true);
    try {
      const tokens = await api.loginEmail(email.trim(), password);
      await finish(tokens);
    } catch {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setLoading(true);
    try {
      if (getApiMode() === 'mock') {
        await finish(await api.loginGoogle('mock-google'));
        return;
      }
      ensureGoogle();
      const result = await GoogleSignin.signIn();
      if ('type' in result && result.type === 'cancelled') return;
      const idToken =
        result && typeof result === 'object' && 'data' in result
          ? result.data?.idToken
          : (result as { idToken?: string | null }).idToken;
      if (!idToken) throw new Error('missing id token');
      await finish(await api.loginGoogle(idToken));
    } catch (error) {
      if (isUserCancel(error)) return;
      const message = error instanceof Error ? error.message : '';
      setError(
        message === 'GOOGLE_NOT_CONFIGURED'
          ? 'Google ainda não está configurado neste build.'
          : 'Não foi possível entrar com o Google.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function onApple() {
    setError(null);
    setLoading(true);
    try {
      if (getApiMode() === 'mock') {
        await finish(await api.loginApple('mock-apple', 'mock-code'));
        return;
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('missing identity token');
      await finish(await api.loginApple(credential.identityToken, credential.authorizationCode ?? undefined));
    } catch (error) {
      if (isUserCancel(error)) return;
      setError('Não foi possível entrar com a Apple.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, backgroundColor: theme.bg }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <Image source={require('../../../assets/images/icon.png')} style={styles.logo} />
        <Text style={[styles.brand, { color: theme.primary }]}>fitcupons</Text>
        <Text style={[styles.tagline, { color: theme.inkMuted }]}>
          As melhores ofertas do esporte, num lugar só
        </Text>
      </View>

      <GoogleButton onPress={onGoogle} disabled={loading} />

      {Platform.OS === 'ios' ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            theme.scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={10}
          style={styles.apple}
          onPress={onApple}
        />
      ) : null}

      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <Text style={[styles.or, { color: theme.inkMuted }]}>ou</Text>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>

      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField label="Senha" value={password} onChangeText={setPassword} password />
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button label="Entrar" onPress={onEmail} loading={loading} />

      <View style={styles.links}>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Esqueci minha senha">
            <Text style={[styles.link, { color: theme.primary }]}>Esqueci minha senha</Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Criar conta">
            <Text style={[styles.link, { color: theme.primary }]}>Criar conta</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 14 },
  hero: { alignItems: 'center', gap: 8, marginBottom: 12 },
  logo: { width: 72, height: 72, borderRadius: 16 },
  brand: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  tagline: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  apple: { height: 48, width: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  or: { fontSize: 13, fontWeight: '600' },
  error: { fontSize: 13, fontWeight: '600' },
  links: { alignItems: 'center', gap: 12, marginTop: 8 },
  link: { fontSize: 15, fontWeight: '600', minHeight: 44, textAlignVertical: 'center' },
});
