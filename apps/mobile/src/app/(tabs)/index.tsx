import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { OfferListItem } from '@fitcupons/shared';

import { OfferCard } from '@/components/OfferCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState, ErrorCard, SkeletonBlock } from '@/components/ui/States';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { useSessionStore } from '@/store/session';
import { showToast } from '@/store/toast';
import { useTheme } from '@/theme';

function OfferSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <SkeletonBlock height={32} width={32} />
        <SkeletonBlock height={16} width="40%" />
      </View>
      <SkeletonBlock height={280} />
      <SkeletonBlock height={20} width="50%" />
      <SkeletonBlock height={16} />
    </View>
  );
}

export default function FeedScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const listRef = useRef<FlatList<OfferListItem>>(null);
  const me = useSessionStore((state) => state.me);
  const offline = useSessionStore((state) => state.offline);
  const [sportFilter, setSportFilter] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: api.categories });
  const filters = useMemo(
    () => ({
      limit: 10,
      sports: sportFilter,
      categoryId,
      includeTotal: Boolean(sportFilter || categoryId),
    }),
    [categoryId, sportFilter],
  );

  const feed = useInfiniteQuery({
    queryKey: queryKeys.offers(filters),
    queryFn: ({ pageParam }) => api.offers({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const items = useMemo(() => feed.data?.pages.flatMap((page) => page.items) ?? [], [feed.data]);
  const meta = feed.data?.pages[0]?.meta;
  const since = items[0]?.publishedAt ?? undefined;

  const newCountQuery = useQuery({
    queryKey: queryKeys.newCount({ ...filters, since }),
    queryFn: () => api.newCount({ ...filters, since: since! }),
    enabled: Boolean(since),
  });

  useFocusEffect(
    useCallback(() => {
      if (since) void newCountQuery.refetch();
    }, [newCountQuery, since]),
  );

  const selectedSport = me?.sports.find((sport) => sportFilter === sport.slug);
  const selectedCategory = categoriesQuery.data?.find((category) => category.id === categoryId);
  const filterLabel = [selectedSport?.name ?? (sportFilter === 'all' ? 'Tudo' : null), selectedCategory?.name]
    .filter(Boolean)
    .join(' · ');

  function emptyCopy() {
    if (meta?.appliedSportFilter === 'explicit' || categoryId) {
      return {
        title: `Nenhuma promoção${filterLabel ? ` de ${filterLabel}` : ''}`,
        action: 'Limpar filtros',
        onAction: () => {
          setSportFilter(undefined);
          setCategoryId(undefined);
        },
      };
    }
    if (meta?.appliedSportFilter === 'preferences') {
      return {
        title: 'Nada nos seus esportes — ver tudo?',
        action: 'Ver tudo',
        onAction: () => setSportFilter('all'),
      };
    }
    return {
      title: 'Em breve as primeiras promoções',
      action: 'Ajustar esportes',
      onAction: () => router.push('/onboarding/sports?mode=edit'),
    };
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      {offline ? (
        <View style={[styles.offline, { backgroundColor: theme.amberSoft }]}>
          <Text style={{ color: theme.amber, fontWeight: '600' }}>Sem conexão. Mostrando o que já estava salvo.</Text>
        </View>
      ) : null}

      <View style={styles.topBar}>
        <Text style={[styles.logo, { color: theme.primary }]}>fitcupons</Text>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            onPress={() => router.push('/(tabs)/search')}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="magnify" size={24} color={theme.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            onPress={() => showToast('em breve')}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.ink} />
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Tudo" selected={sportFilter === 'all'} onPress={() => setSportFilter('all')} />
        {me?.sports.map((sport) => (
          <Chip
            key={sport.id}
            label={sport.name}
            iconName={sport.iconName}
            selected={sportFilter === sport.slug}
            onPress={() => setSportFilter(sportFilter === sport.slug ? undefined : sport.slug)}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categoriesQuery.data?.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            iconName={category.iconName}
            selected={categoryId === category.id}
            onPress={() => setCategoryId(categoryId === category.id ? undefined : category.id)}
          />
        ))}
      </ScrollView>

      {sportFilter || categoryId ? (
        <View style={styles.filterLine}>
          <Text style={{ color: theme.inkMuted, flex: 1 }}>
            {filterLabel}
            {meta?.totalHint != null ? ` · ${meta.totalHint}` : ''}
          </Text>
          <Pressable
            onPress={() => {
              setSportFilter(undefined);
              setCategoryId(undefined);
            }}
            accessibilityRole="button"
            accessibilityLabel="Limpar filtros"
          >
            <Text style={{ color: theme.primary, fontWeight: '700' }}>limpar</Text>
          </Pressable>
        </View>
      ) : null}

      {me && !me.emailVerified ? (
        <View style={[styles.verify, { backgroundColor: theme.primarySoft }]}>
          <Text style={{ color: theme.ink, flex: 1 }}>Confirme seu e-mail</Text>
          <Pressable
            onPress={() => {
              if (me.email) void api.resendVerification(me.email).then(() => showToast('Enviamos o e-mail de novo.'));
            }}
            accessibilityRole="button"
            accessibilityLabel="Reenviar"
          >
            <Text style={{ color: theme.primary, fontWeight: '700' }}>Reenviar</Text>
          </Pressable>
        </View>
      ) : null}

      {newCountQuery.data && newCountQuery.data.count > 0 ? (
        <Pressable
          style={[styles.pill, { backgroundColor: theme.primary }]}
          onPress={() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
            void feed.refetch();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${newCountQuery.data.count} novas promoções`}
        >
          <MaterialCommunityIcons name="arrow-up" size={16} color="#FFFFFF" />
          <Text style={styles.pillText}>
            {newCountQuery.data.count === 1 ? '1 nova promoção' : `${newCountQuery.data.count} novas promoções`}
          </Text>
        </Pressable>
      ) : null}

      {feed.isPending ? (
        <View>
          <OfferSkeleton />
          <OfferSkeleton />
          <OfferSkeleton />
        </View>
      ) : feed.isError ? (
        <ErrorCard onRetry={() => feed.refetch()} />
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OfferCard offer={item} width={width} onPress={() => router.push(`/offer/${item.slug}`)} />
          )}
          onEndReached={() => {
            if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => feed.refetch()} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="ticket-percent-outline"
              title={emptyCopy().title}
              actionLabel={emptyCopy().action}
              onAction={emptyCopy().onAction}
            />
          }
          ListFooterComponent={
            feed.isFetchingNextPage ? (
              <OfferSkeleton />
            ) : !feed.hasNextPage && items.length > 0 ? (
              <Text style={[styles.end, { color: theme.inkMuted }]}>Você viu tudo por aqui</Text>
            ) : (
              <View style={{ height: 24 }} />
            )
          }
        />
      )}
      {feed.isFetching && !feed.isPending ? <ActivityIndicator style={StyleSheet.absoluteFill} color="transparent" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  offline: { paddingHorizontal: 16, paddingVertical: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  topActions: { flexDirection: 'row' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chips: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterLine: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  verify: { marginHorizontal: 16, marginBottom: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 8,
  },
  pillText: { color: '#FFFFFF', fontWeight: '700' },
  end: { textAlign: 'center', paddingVertical: 20, fontSize: 13 },
});
