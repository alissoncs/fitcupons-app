import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import type { AuthProvider } from '@fitcupons/shared';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { api } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useSessionStore } from '@/store/session';
import { showToast } from '@/store/toast';
import { useTheme } from '@/theme';

const PROVIDER_LABEL: Record<AuthProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  email: 'Senha',
};

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.row, { borderColor: theme.border }]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={danger ? theme.danger : theme.ink} />
      <Text style={[styles.rowLabel, { color: danger ? theme.danger : theme.ink }]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.inkMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const me = useSessionStore((state) => state.me);
  const signOut = useSessionStore((state) => state.signOut);
  const refreshMe = useSessionStore((state) => state.refreshMe);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function onChangePassword() {
    if (newPassword.length < 8) {
      showToast('A nova senha precisa ter no mínimo 8 caracteres.');
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(newPassword, me?.hasPassword ? currentPassword : undefined);
      showToast(me?.hasPassword ? 'Senha alterada.' : 'Senha definida.');
      setPasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      await refreshMe();
    } catch {
      showToast('Não deu para atualizar a senha.');
    } finally {
      setSaving(false);
    }
  }

  function onLogout() {
    Alert.alert('Sair', 'Quer sair da sua conta neste aparelho?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          void signOut().then(() => router.replace('/(auth)/sign-in'));
        },
      },
    ]);
  }

  function onDelete() {
    Alert.alert(
      'Excluir minha conta',
      'Isso apaga sua conta de forma irreversível. Favoritos e histórico somem com ela.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirmar exclusão', 'Tem certeza? Esta ação não pode ser desfeita.', [
              { text: 'Voltar', style: 'cancel' },
              {
                text: 'Excluir conta',
                style: 'destructive',
                onPress: () => {
                  void (async () => {
                    try {
                      await api.deleteMe();
                      await signOut();
                      router.replace('/(auth)/sign-in');
                    } catch {
                      showToast('Não deu para excluir a conta.');
                    }
                  })();
                },
              },
            ]);
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
        gap: 16,
        backgroundColor: theme.bg,
      }}
      style={{ backgroundColor: theme.bg }}
    >
      <View style={styles.header}>
        <Image
          source={me?.avatarUrl ? { uri: me.avatarUrl } : require('../../../assets/images/icon.png')}
          style={[styles.avatar, { backgroundColor: theme.primarySoft }]}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.ink }]}>{me?.name ?? 'Sua conta'}</Text>
          <Text style={[styles.email, { color: theme.inkMuted }]}>{me?.email}</Text>
        </View>
      </View>

      <View style={styles.chips}>
        {me?.providers.map((provider) => (
          <Chip key={provider} label={PROVIDER_LABEL[provider]} selected />
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: theme.radius.card }]}>
        <Row icon="bike" label="Meus esportes" onPress={() => router.push('/onboarding/sports?mode=edit')} />
        <Row
          icon="lock-outline"
          label={me?.hasPassword ? 'Alterar senha' : 'Definir senha'}
          onPress={() => setPasswordOpen((value) => !value)}
        />
        <Row icon="bell-outline" label="Notificações" onPress={() => showToast('em breve')} />
        <Row
          icon="file-document-outline"
          label="Termos"
          onPress={() => void WebBrowser.openBrowserAsync(`${API_URL}/legal/terms`)}
        />
        <Row
          icon="shield-outline"
          label="Privacidade"
          onPress={() => void WebBrowser.openBrowserAsync(`${API_URL}/legal/privacy`)}
        />
        <Row icon="information-outline" label="Sobre" onPress={() => showToast('fitcupons 1.0.0')} />
      </View>

      {passwordOpen ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: theme.radius.card, padding: 16, gap: 12 }]}>
          {me?.hasPassword ? (
            <TextField label="Senha atual" value={currentPassword} onChangeText={setCurrentPassword} password />
          ) : null}
          <TextField label="Nova senha" value={newPassword} onChangeText={setNewPassword} password />
          <Button label="Salvar senha" onPress={onChangePassword} loading={saving} />
        </View>
      ) : null}

      <Button label="Sair" variant="secondary" onPress={onLogout} />
      <Button label="Excluir minha conta" variant="danger" onPress={onDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  name: { fontSize: 22, fontWeight: '800' },
  email: { fontSize: 14, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderWidth: 1, overflow: 'hidden' },
  row: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
});
