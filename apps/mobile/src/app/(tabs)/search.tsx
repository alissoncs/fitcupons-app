import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { FilterSheet, type SearchFilters } from '@/components/FilterSheet';
import { OfferGridCard } from '@/components/OfferGridCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState, ErrorCard, SkeletonBlock } from '@/components/ui/States';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { getRecentSearches, setRecentSearches } from '@/lib/storage';
import { useTheme } from '@/theme';

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [text, setText] = useState('');
  const search = useDebounce(text.trim(), 300);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sheet, setSheet] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    void getRecentSearches().then(setRecents);
  }, []);

  useEffect(() => {
    if (search.length < 2) return;
    void getRecentSearches().then((current) => {
      const next = [search, ...current.filter((item) => item !== search)].slice(0, 8);
      setRecents(next);
      void setRecentSearches(next);
    });
  }, [search]);

  const sportsQuery = useQuery({ queryKey: queryKeys.sports, queryFn: api.sports });
  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: api.categories });
  const storesQuery = useQuery({ queryKey: queryKeys.stores, queryFn: api.stores });

  const query = useMemo(
    () => ({
      search: search.length >= 2 ? search : undefined,
      ...filters,
      limit: 10,
    }),
    [filters, search],
  );

  const results = useInfiniteQuery({
    queryKey: queryKeys.offers({ kind: 'search', ...query }),
    queryFn: ({ pageParam }) => api.offers({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: search.length >= 2 || Object.keys(filters).length > 0,
  });

  const items = results.data?.pages.flatMap((page) => page.items) ?? [];

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.sports) {
    activeChips.push({
      key: 'sports',
      label: filters.sports
        .split(',')
        .map((slug) => sportsQuery.data?.find((sport) => sport.slug === slug)?.name ?? slug)
        .join(', '),
      clear: () => setFilters((current) => ({ ...current, sports: undefined })),
    });
  }
  if (filters.categoryId) {
    activeChips.push({
      key: 'cat',
      label: categoriesQuery.data?.find((category) => category.id === filters.categoryId)?.name ?? 'Categoria',
      clear: () => setFilters((current) => ({ ...current, categoryId: undefined })),
    });
  }
  if (filters.storeId) {
    activeChips.push({
      key: 'store',
      label: storesQuery.data?.find((store) => store.id === filters.storeId)?.name ?? 'Loja',
      clear: () => setFilters((current) => ({ ...current, storeId: undefined })),
    });
  }
  if (filters.hasCoupon) {
    activeChips.push({
      key: 'coupon',
      label: 'Com cupom',
      clear: () => setFilters((current) => ({ ...current, hasCoupon: undefined })),
    });
  }
  if (filters.minDiscount) {
    activeChips.push({
      key: 'disc',
      label: `${filters.minDiscount}%+`,
      clear: () => setFilters((current) => ({ ...current, minDiscount: undefined })),
    });
  }

  const idle = search.length < 2 && Object.keys(filters).length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.searchRow}>
        <View style={[styles.field, { borderColor: theme.border, backgroundColor: theme.surface, borderRadius: theme.radius.button }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.inkMuted} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Buscar ofertas ou lojas"
            placeholderTextColor={theme.inkMuted}
            style={[styles.input, { color: theme.ink }]}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros"
          onPress={() => setSheet(true)}
          style={[styles.filterBtn, { borderColor: theme.border, borderRadius: theme.radius.button }]}
        >
          <MaterialCommunityIcons name="tune-variant" size={22} color={theme.primary} />
        </Pressable>
      </View>

      {activeChips.length > 0 ? (
        <View style={styles.chips}>
          {activeChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} selected removable onPress={chip.clear} />
          ))}
        </View>
      ) : null}

      {idle ? (
        <View style={styles.recents}>
          <Text style={[styles.section, { color: theme.inkMuted }]}>Buscas recentes</Text>
          {recents.length === 0 ? (
            <Text style={{ color: theme.inkMuted }}>Nada por aqui ainda.</Text>
          ) : (
            recents.map((item) => (
              <Pressable key={item} onPress={() => setText(item)} style={styles.recent} accessibilityRole="button">
                <MaterialCommunityIcons name="history" size={18} color={theme.inkMuted} />
                <Text style={{ color: theme.ink }}>{item}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : results.isPending ? (
        <View style={styles.gridPad}>
          <SkeletonBlock height={180} width="47%" />
          <SkeletonBlock height={180} width="47%" />
        </View>
      ) : results.isError ? (
        <ErrorCard onRetry={() => results.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <OfferGridCard offer={item} onPress={() => router.push(`/offer/${item.slug}`)} />
            </View>
          )}
          onEndReached={() => {
            if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<EmptyState title="Nenhuma oferta encontrada" subtitle="Tente outro termo ou limpe os filtros." />}
        />
      )}

      <FilterSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        value={filters}
        onApply={setFilters}
        sports={sportsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        stores={storesQuery.data ?? []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, alignItems: 'center' },
  field: { flex: 1, minHeight: 48, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  filterBtn: { width: 48, height: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  recents: { padding: 16, gap: 10 },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  grid: { padding: 16, gap: 12 },
  row: { gap: 12 },
  cell: { flex: 1 },
  gridPad: { flexDirection: 'row', gap: 12, padding: 16 },
});
