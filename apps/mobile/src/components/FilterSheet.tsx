import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Category, OfferSort, Sport, Store } from '@fitcupons/shared';

import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useTheme } from '@/theme';

export type SearchFilters = {
  sports?: string;
  categoryId?: string;
  storeId?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  minDiscount?: number;
  hasCoupon?: boolean;
  sort?: OfferSort;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  value: SearchFilters;
  onApply: (next: SearchFilters) => void;
  sports: Sport[];
  categories: Category[];
  stores: Store[];
};

function reaisToCents(raw: string): number | undefined {
  const normalized = raw.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
  if (!normalized) return undefined;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value * 100);
}

function centsToReais(cents?: number): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function FilterSheet({ visible, onClose, value, onApply, sports, categories, stores }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<SearchFilters>(value);
  const [minPrice, setMinPrice] = useState(centsToReais(value.minPriceCents));
  const [maxPrice, setMaxPrice] = useState(centsToReais(value.maxPriceCents));
  const [minDiscount, setMinDiscount] = useState(value.minDiscount != null ? String(value.minDiscount) : '');

  const selectedSports = new Set((draft.sports ?? '').split(',').filter(Boolean));

  function toggleSport(slug: string) {
    const next = new Set(selectedSports);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setDraft({ ...draft, sports: [...next].join(',') || undefined });
  }

  function apply() {
    onApply({
      ...draft,
      minPriceCents: reaisToCents(minPrice),
      maxPriceCents: reaisToCents(maxPrice),
      minDiscount: minDiscount ? Number(minDiscount) : undefined,
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} onShow={() => setDraft(value)}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar filtros" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              paddingBottom: insets.bottom + 16,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.ink }]}>Filtros</Text>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.section, { color: theme.inkMuted }]}>Ordenar</Text>
            <View style={styles.row}>
              {(
                [
                  ['recent', 'Mais recentes'],
                  ['discount', 'Maior desconto'],
                  ['popular', 'Mais vistas'],
                ] as const
              ).map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  selected={(draft.sort ?? 'recent') === key}
                  onPress={() => setDraft({ ...draft, sort: key })}
                />
              ))}
            </View>

            <Text style={[styles.section, { color: theme.inkMuted }]}>Esporte</Text>
            <View style={styles.row}>
              {sports.map((sport) => (
                <Chip
                  key={sport.id}
                  label={sport.name}
                  iconName={sport.iconName}
                  selected={selectedSports.has(sport.slug)}
                  onPress={() => toggleSport(sport.slug)}
                />
              ))}
            </View>

            <Text style={[styles.section, { color: theme.inkMuted }]}>Categoria</Text>
            <View style={styles.row}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  iconName={category.iconName}
                  selected={draft.categoryId === category.id}
                  onPress={() =>
                    setDraft({ ...draft, categoryId: draft.categoryId === category.id ? undefined : category.id })
                  }
                />
              ))}
            </View>

            <Text style={[styles.section, { color: theme.inkMuted }]}>Loja</Text>
            <View style={styles.row}>
              {stores.map((store) => (
                <Chip
                  key={store.id}
                  label={store.name}
                  selected={draft.storeId === store.id}
                  onPress={() => setDraft({ ...draft, storeId: draft.storeId === store.id ? undefined : store.id })}
                />
              ))}
            </View>

            <TextField label="Preço mínimo (R$)" value={minPrice} onChangeText={setMinPrice} keyboardType="decimal-pad" />
            <TextField label="Preço máximo (R$)" value={maxPrice} onChangeText={setMaxPrice} keyboardType="decimal-pad" />
            <TextField
              label="Desconto mínimo (%)"
              value={minDiscount}
              onChangeText={setMinDiscount}
              keyboardType="number-pad"
            />

            <Chip
              label="Só com cupom"
              selected={Boolean(draft.hasCoupon)}
              onPress={() => setDraft({ ...draft, hasCoupon: draft.hasCoupon ? undefined : true })}
            />
          </ScrollView>
          <View style={styles.actions}>
            <Button
              label="Limpar"
              variant="ghost"
              onPress={() => {
                setDraft({});
                setMinPrice('');
                setMaxPrice('');
                setMinDiscount('');
              }}
              style={{ flex: 1 }}
            />
            <Button label="Aplicar" onPress={apply} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  content: { gap: 12, paddingBottom: 16 },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 12, paddingTop: 8 },
});
