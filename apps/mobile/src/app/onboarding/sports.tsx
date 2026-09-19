import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { SPORTS, type Sport } from '@fitcupons/shared';

import { SportsPicker } from '@/components/SportsPicker';
import { Button } from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/States';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { useSessionStore } from '@/store/session';
import { showToast } from '@/store/toast';
import { useTheme } from '@/theme';

export default function SportsOnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isEdit = params.mode === 'edit';
  const me = useSessionStore((state) => state.me);
  const setMe = useSessionStore((state) => state.setMe);
  const [selected, setSelected] = useState<string[]>(me?.sports.map((sport) => sport.id) ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && me?.onboarded === false) return;
    if (me?.onboarded && !isEdit) router.replace('/(tabs)');
  }, [isEdit, me?.onboarded, router]);

  const sportsQuery = useQuery({
    queryKey: queryKeys.sports,
    queryFn: api.sports,
  });

  const catalog: Sport[] =
    sportsQuery.data ??
    SPORTS.map((sport, index) => ({
      id: `fallback_${sport.slug}`,
      slug: sport.slug,
      name: sport.name,
      iconName: sport.iconName,
      sortOrder: index + 1,
      active: true,
    }));

  async function onContinue() {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      const next = await api.setSports(selected);
      setMe(next);
      if (isEdit) router.back();
      else router.replace('/(tabs)');
    } catch {
      showToast('Não deu para salvar seus esportes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top + 16 }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.ink }]}>O que você pratica?</Text>
        <Text style={[styles.sub, { color: theme.inkMuted }]}>Escolha ao menos um. Dá pra mudar depois.</Text>
        {sportsQuery.isPending ? <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} /> : null}
        {sportsQuery.isError ? <ErrorCard onRetry={() => sportsQuery.refetch()} /> : null}
        <SportsPicker sports={catalog} selectedIds={selected} onChange={setSelected} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: theme.border, backgroundColor: theme.surface }]}>
        <Button
          label={`${isEdit ? 'Salvar' : 'Continuar'} (${selected.length})`}
          onPress={onContinue}
          loading={saving}
          disabled={selected.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
