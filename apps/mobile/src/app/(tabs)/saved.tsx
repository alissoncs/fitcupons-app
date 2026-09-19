import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { RedeemAction } from '@fitcupons/shared';

import { OfferGridCard } from '@/components/OfferGridCard';
import { EmptyState, ErrorCard, SkeletonBlock } from '@/components/ui/States';
import { useFavorite } from '@/hooks/use-favorite';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { dayGroupLabel } from '@/lib/relative-time';
import { useTheme } from '@/theme';

function actionLabel(action: RedeemAction): string {
  if (action === 'copy_code') return 'Copiou o cupom';
  if (action === 'open_link') return 'Foi à loja';
  return 'Viu';
}

export default function SavedScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<'favorites' | 'history'>('favorites');
  const favorite = useFavorite();
  const queryClient = useQueryClient();

  const favorites = useInfiniteQuery({
    queryKey: queryKeys.favorites,
    queryFn: ({ pageParam }) => api.favorites(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const history = useInfiniteQuery({
    queryKey: queryKeys.redeems,
    queryFn: ({ pageParam }) => api.redeems(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const favoriteItems = favorites.data?.pages.flatMap((page) => page.items) ?? [];
  const redeemItems = history.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top + 8 }]}>
      <Text style={[styles.title, { color: theme.ink }]}>Salvos</Text>
      <View style={[styles.switch, { backgroundColor: theme.primarySoft, borderRadius: theme.radius.button }]}>
        <Pressable
          onPress={() => setTab('favorites')}
          style={[styles.switchBtn, tab === 'favorites' && { backgroundColor: theme.primary }]}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'favorites' }}
        >
          <Text style={{ color: tab === 'favorites' ? '#FFFFFF' : theme.primary, fontWeight: '700' }}>Favoritos</Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('history')}
          style={[styles.switchBtn, tab === 'history' && { backgroundColor: theme.primary }]}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'history' }}
        >
          <Text style={{ color: tab === 'history' ? '#FFFFFF' : theme.primary, fontWeight: '700' }}>Histórico</Text>
        </Pressable>
      </View>

      {tab === 'favorites' ? (
        favorites.isPending ? (
          <View style={styles.gridPad}>
            <SkeletonBlock height={180} width="47%" />
            <SkeletonBlock height={180} width="47%" />
          </View>
        ) : favorites.isError ? (
          <ErrorCard onRetry={() => favorites.refetch()} />
        ) : (
          <FlatList
            data={favoriteItems}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={() => (
                  <Pressable
                    onPress={() => {
                      favorite.mutate(
                        { id: item.id, next: false },
                        { onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites }) },
                      );
                    }}
                    style={[styles.swipe, { backgroundColor: theme.danger }]}
                    accessibilityLabel="Remover dos favoritos"
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Remover</Text>
                  </Pressable>
                )}
              >
                <View style={styles.cell}>
                  <OfferGridCard offer={item} onPress={() => router.push(`/offer/${item.slug}`)} />
                </View>
              </Swipeable>
            )}
            ListEmptyComponent={<EmptyState title="Toque no coração para salvar uma promoção." icon="heart-outline" />}
          />
        )
      ) : history.isPending ? (
        <View style={{ padding: 16, gap: 10 }}>
          <SkeletonBlock height={56} />
          <SkeletonBlock height={56} />
        </View>
      ) : history.isError ? (
        <ErrorCard onRetry={() => history.refetch()} />
      ) : (
        <FlatList
          data={redeemItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item, index }) => {
            const day = dayGroupLabel(item.createdAt);
            const prev = redeemItems[index - 1];
            const showDay = !prev || dayGroupLabel(prev.createdAt) !== day;
            return (
              <View>
                {showDay ? <Text style={[styles.day, { color: theme.inkMuted }]}>{day}</Text> : null}
                <Pressable
                  onPress={() => router.push(`/offer/${item.offer.slug}`)}
                  style={[styles.history, { borderColor: theme.border, backgroundColor: theme.surface, borderRadius: theme.radius.card }]}
                >
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>{actionLabel(item.action)}</Text>
                  <Text style={{ color: theme.ink }} numberOfLines={1}>
                    {item.offer.title}
                  </Text>
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={<EmptyState title="Seu histórico aparece aqui." subtitle="Abra uma oferta para começar." icon="history" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: 16 },
  switch: { flexDirection: 'row', margin: 16, padding: 4 },
  switchBtn: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  grid: { padding: 16, gap: 12 },
  row: { gap: 12 },
  cell: { flex: 1 },
  gridPad: { flexDirection: 'row', gap: 12, padding: 16 },
  swipe: { justifyContent: 'center', paddingHorizontal: 16, marginBottom: 12 },
  day: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 8 },
  history: { borderWidth: 1, padding: 12, gap: 4 },
});
