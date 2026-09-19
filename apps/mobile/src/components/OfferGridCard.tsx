import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { formatCents, type OfferListItem } from '@fitcupons/shared';

import { useTheme } from '@/theme';

type Props = {
  offer: OfferListItem;
  onPress: () => void;
};

export function OfferGridCard({ offer, onPress }: Props) {
  const theme = useTheme();
  const image = offer.images[0];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={offer.title}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: theme.radius.card }]}
    >
      <View>
        <Image
          source={image ? { uri: image.url } : undefined}
          placeholder={image?.blurhash ? { blurhash: image.blurhash } : undefined}
          contentFit="cover"
          style={styles.image}
        />
        {offer.discountPercent != null ? (
          <View
            style={[styles.badge, { backgroundColor: theme.accent }]}
            accessibilityLabel={`${offer.discountPercent} por cento de desconto`}
          >
            <Text style={styles.badgeText}>{`−${offer.discountPercent}%`}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.store, { color: theme.inkMuted }]} numberOfLines={1}>
          {offer.store.name}
        </Text>
        <Text style={[styles.title, { color: theme.ink }]} numberOfLines={2}>
          {offer.title}
        </Text>
        {offer.priceCents != null ? (
          <Text style={[styles.price, { color: theme.ink }]}>{formatCents(offer.priceCents)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderWidth: 1, flex: 1 },
  image: { width: '100%', aspectRatio: 1, backgroundColor: '#EFEBF7' },
  badge: { position: 'absolute', top: 8, right: 8, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  body: { padding: 10, gap: 2 },
  store: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 13, fontWeight: '600', minHeight: 34 },
  price: { fontSize: 14, fontWeight: '700', marginTop: 2 },
});
