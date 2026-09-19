import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCents, type OfferListItem } from '@fitcupons/shared';

import { ImageCarousel } from '@/components/ImageCarousel';
import { Chip } from '@/components/ui/Chip';
import { useFavorite } from '@/hooks/use-favorite';
import { formatExpiresIn, formatRelativeTime } from '@/lib/relative-time';
import { useTheme } from '@/theme';

type Props = {
  offer: OfferListItem;
  width: number;
  onPress: () => void;
};

export function OfferCard({ offer, width, onPress }: Props) {
  const theme = useTheme();
  const favorite = useFavorite();
  const expiresLabel = offer.endingSoon ? formatExpiresIn(offer.expiresAt) : null;

  async function share() {
    await Share.share({
      message: `${offer.title} — ${offer.store.name}`,
      title: offer.title,
    });
  }

  return (
    <View style={[styles.card, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={onPress} style={styles.store} accessibilityRole="button" accessibilityLabel={offer.store.name}>
          <Image
            source={offer.store.logoUrl ? { uri: offer.store.logoUrl } : undefined}
            style={[styles.avatar, { backgroundColor: theme.primarySoft }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.storeName, { color: theme.ink }]} numberOfLines={1}>
              {offer.store.name}
            </Text>
            <Text style={[styles.time, { color: theme.inkMuted }]}>{formatRelativeTime(offer.publishedAt)}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={offer.isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          hitSlop={8}
          onPress={() => favorite.mutate({ id: offer.id, next: !offer.isFavorite })}
          style={styles.iconBtn}
        >
          <MaterialCommunityIcons
            name={offer.isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={offer.isFavorite ? theme.primary : theme.ink}
          />
        </Pressable>
      </View>

      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={offer.title}>
        <View>
          <ImageCarousel
            images={offer.images.map((image) => ({ url: image.url, blurhash: image.blurhash, alt: image.alt }))}
            width={width}
            height={width}
          />
          {offer.discountPercent != null ? (
            <View
              style={[styles.discount, { backgroundColor: theme.accent, borderRadius: 8 }]}
              accessibilityLabel={`${offer.discountPercent} por cento de desconto`}
            >
              <Text style={styles.discountText}>{`−${offer.discountPercent}%`}</Text>
            </View>
          ) : null}
          {expiresLabel ? (
            <View style={[styles.ending, { backgroundColor: theme.amber, borderRadius: 8 }]}>
              <Text style={styles.endingText}>{expiresLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {offer.priceCents != null ? (
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: theme.ink }]}>{formatCents(offer.priceCents)}</Text>
              {offer.originalPriceCents != null ? (
                <Text style={[styles.original, { color: theme.inkMuted }]}>{formatCents(offer.originalPriceCents)}</Text>
              ) : null}
            </View>
          ) : null}
          {offer.savingsCents != null ? (
            <Text style={[styles.save, { color: theme.accent }]}>{`Economize ${formatCents(offer.savingsCents)}`}</Text>
          ) : null}
          <Text style={[styles.title, { color: theme.ink }]} numberOfLines={2}>
            {offer.title}
          </Text>
          {offer.couponCode ? (
            <View style={[styles.coupon, { borderColor: theme.primary }]}>
              <Text style={[styles.couponText, { color: theme.primary }]}>{offer.couponCode}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.chips}>
          {offer.sports.slice(0, 3).map((sport) => (
            <Chip key={sport.id} label={sport.name} iconName={sport.iconName} />
          ))}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Compartilhar" onPress={share} style={styles.iconBtn}>
          <MaterialCommunityIcons name="share-variant-outline" size={22} color={theme.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  store: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  storeName: { fontSize: 14, fontWeight: '600' },
  time: { fontSize: 12 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  discount: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 4 },
  discountText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  ending: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 4 },
  endingText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  body: { paddingHorizontal: 16, paddingTop: 12, gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontSize: 20, fontWeight: '700' },
  original: { fontSize: 14, textDecorationLine: 'line-through' },
  save: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '600' },
  coupon: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  couponText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
});
