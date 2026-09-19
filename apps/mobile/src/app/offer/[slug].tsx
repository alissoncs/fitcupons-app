import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { formatCents } from '@fitcupons/shared';

import { ImageCarousel } from '@/components/ImageCarousel';
import { OfferGridCard } from '@/components/OfferGridCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState, ErrorCard, SkeletonBlock } from '@/components/ui/States';
import { useFavorite } from '@/hooks/use-favorite';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { formatDate, formatRelativeTime } from '@/lib/relative-time';
import { useTheme } from '@/theme';

export default function OfferDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const favorite = useFavorite();
  const viewed = useRef(false);
  const [copied, setCopied] = useState(false);
  const [showStoreAfterCopy, setShowStoreAfterCopy] = useState(false);
  const [copyingGo, setCopyingGo] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const detail = useQuery({
    queryKey: queryKeys.offer(slug ?? ''),
    queryFn: () => api.offer(slug ?? ''),
    enabled: Boolean(slug),
  });

  const offer = detail.data;

  useEffect(() => {
    if (!offer || viewed.current) return;
    viewed.current = true;
    void api.redeem(offer.id, 'view');
  }, [offer]);

  const related = useQuery({
    queryKey: queryKeys.offers({ related: offer?.id, sport: offer?.sports[0]?.slug }),
    queryFn: () =>
      api.offers({
        sports: offer?.sports[0]?.slug,
        limit: 10,
        excludeOfferId: offer?.id,
      }),
    enabled: Boolean(offer?.id && offer.sports[0]?.slug),
  });

  const storeUrl = offer ? offer.affiliateUrl ?? offer.destinationUrl : '';

  async function copyCode() {
    if (!offer?.couponCode) return;
    await Clipboard.setStringAsync(offer.couponCode);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await api.redeem(offer.id, 'copy_code');
    setCopied(true);
    setShowStoreAfterCopy(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function openStore() {
    if (!offer || !storeUrl) return;
    await api.redeem(offer.id, 'open_link');
    await WebBrowser.openBrowserAsync(storeUrl);
  }

  async function copyAndGo() {
    if (!offer?.couponCode) return;
    setCopyingGo(true);
    await Clipboard.setStringAsync(offer.couponCode);
    await api.redeem(offer.id, 'copy_code');
    setTimeout(() => {
      void (async () => {
        await api.redeem(offer.id, 'open_link');
        await WebBrowser.openBrowserAsync(storeUrl);
        setCopyingGo(false);
      })();
    }, 400);
  }

  if (detail.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <SkeletonBlock height={320} />
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonBlock height={24} width="60%" />
          <SkeletonBlock height={80} />
        </View>
      </View>
    );
  }

  if (detail.isError || !offer) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <ErrorCard onRetry={() => detail.refetch()} />
      </View>
    );
  }

  const images = offer.images.map((image) => ({
    url: image.urlFull || image.urlCard,
    blurhash: image.blurhash,
    alt: image.alt,
  }));
  const hasCoupon = Boolean(offer.couponCode);
  const hasLink = Boolean(storeUrl);

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <View>
          <ImageCarousel
            images={images}
            width={width}
            height={320}
            onPressImage={(index) => setLightbox(index)}
            bottomLeft={
              offer.discountPercent != null ? (
                <View
                  style={[styles.discount, { backgroundColor: theme.accent }]}
                  accessibilityLabel={`${offer.discountPercent} por cento de desconto`}
                >
                  <Text style={styles.discountText}>{`−${offer.discountPercent}%`}</Text>
                </View>
              ) : null
            }
          />
          <View style={[styles.overlayBar, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} style={styles.capsule} accessibilityLabel="Voltar">
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => favorite.mutate({ id: offer.id, next: !offer.isFavorite })}
                style={styles.capsule}
                accessibilityLabel={offer.isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
              >
                <MaterialCommunityIcons name={offer.isFavorite ? 'heart' : 'heart-outline'} size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => Share.share({ message: `${offer.title} — ${offer.store.name}`, title: offer.title })}
                style={styles.capsule}
                accessibilityLabel="Compartilhar"
              >
                <MaterialCommunityIcons name="share-variant-outline" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.storeRow}>
          <Image source={offer.store.logoUrl ? { uri: offer.store.logoUrl } : undefined} style={styles.storeLogo} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.storeName, { color: theme.ink }]}>{offer.store.name}</Text>
            <Text style={{ color: theme.inkMuted, fontSize: 13 }}>{offer.store.name}</Text>
          </View>
          {offer.verified ? (
            <View style={[styles.verified, { backgroundColor: theme.accentSoft }]}>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>✓ Verificado</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.priceCard, { backgroundColor: theme.accentSoft, borderRadius: theme.radius.card }]}>
          <View style={styles.priceTop}>
            {offer.originalPriceCents != null ? (
              <Text style={[styles.from, { color: theme.inkMuted }]}>{`De ${formatCents(offer.originalPriceCents)}`}</Text>
            ) : (
              <View />
            )}
            {offer.discountPercent != null ? (
              <View style={[styles.miniBadge, { backgroundColor: theme.accent }]}>
                <Text style={styles.discountText}>{`−${offer.discountPercent}%`}</Text>
              </View>
            ) : null}
          </View>
          {offer.priceCents != null ? (
            <Text style={[styles.heroPrice, { color: theme.ink }]}>{formatCents(offer.priceCents)}</Text>
          ) : null}
          {offer.savingsCents != null ? (
            <Text style={{ color: theme.accent, fontWeight: '700' }}>{`Você economiza ${formatCents(offer.savingsCents)}`}</Text>
          ) : null}
        </View>

        {offer.couponCode ? (
          <Pressable
            onPress={copyCode}
            accessibilityRole="button"
            accessibilityLabel="Copiar cupom"
            style={[styles.coupon, { borderColor: theme.primary, borderRadius: theme.radius.card }]}
          >
            <Text style={[styles.code, { color: theme.primary }]}>{offer.couponCode}</Text>
            <MaterialCommunityIcons name="content-copy" size={22} color={theme.primary} />
          </Pressable>
        ) : null}

        <View style={styles.body}>
          <Text style={[styles.title, { color: theme.ink }]}>{offer.title}</Text>
          {offer.description ? <Text style={[styles.desc, { color: theme.ink }]}>{offer.description}</Text> : null}
          <View style={styles.chips}>
            {offer.sports.map((sport) => (
              <Chip key={sport.id} label={sport.name} iconName={sport.iconName} />
            ))}
            {offer.category ? <Chip label={offer.category.name} iconName={offer.category.iconName} /> : null}
          </View>
          <Text style={{ color: theme.inkMuted, fontSize: 13 }}>
            {[
              offer.expiresAt ? `Válida até ${formatDate(offer.expiresAt)}` : null,
              offer.publishedAt ? `Publicada ${formatRelativeTime(offer.publishedAt)}` : null,
              `${offer.viewCount} pessoas viram`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        {related.data?.items.length ? (
          <View style={{ paddingTop: 8 }}>
            <Text style={[styles.relatedTitle, { color: theme.ink }]}>{`Mais de ${offer.sports[0]?.name}`}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.related}>
              {related.data.items.map((item) => (
                <View key={item.id} style={{ width: 168 }}>
                  <OfferGridCard offer={item} onPress={() => router.push(`/offer/${item.slug}`)} />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : related.isError ? (
          <EmptyState title="Não carreguei as relacionadas" />
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        {hasCoupon && !hasLink ? (
          <>
            <Pressable
              onPress={copyCode}
              style={[styles.cta, { backgroundColor: theme.primary, borderRadius: theme.radius.button }]}
              accessibilityLabel="Copiar cupom"
            >
              <Text style={styles.ctaText}>{copied ? 'Copiado ✓' : 'Copiar cupom'}</Text>
            </Pressable>
            {showStoreAfterCopy && storeUrl ? (
              <Pressable onPress={openStore} style={styles.secondaryCta} accessibilityLabel="Ver na loja">
                <Text style={{ color: theme.primary, fontWeight: '700' }}>Ver na loja</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
        {!hasCoupon && hasLink ? (
          <Pressable
            onPress={openStore}
            style={[styles.cta, { backgroundColor: theme.primary, borderRadius: theme.radius.button }]}
            accessibilityLabel="Ver oferta"
          >
            <Text style={styles.ctaText}>Ver oferta</Text>
          </Pressable>
        ) : null}
        {hasCoupon && hasLink ? (
          <Pressable
            onPress={copyAndGo}
            style={[styles.cta, { backgroundColor: theme.primary, borderRadius: theme.radius.button }]}
            accessibilityLabel="Copiar e ir à loja"
          >
            <Text style={styles.ctaText}>{copyingGo ? 'Cupom copiado' : 'Copiar e ir à loja'}</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={lightbox != null} animationType="fade" onRequestClose={() => setLightbox(null)}>
        <Pressable style={styles.lightbox} onPress={() => setLightbox(null)} accessibilityLabel="Fechar foto">
          {lightbox != null && images[lightbox] ? (
            <Image source={{ uri: images[lightbox].url }} style={{ width, height: 480 }} contentFit="contain" />
          ) : null}
          <Text style={styles.lightboxHint}>Toque ou arraste para baixo para fechar</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  overlayBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capsule: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discount: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  discountText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  storeLogo: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEBF7' },
  storeName: { fontSize: 16, fontWeight: '700' },
  verified: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  priceCard: { marginHorizontal: 16, padding: 16, gap: 6 },
  priceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  from: { fontSize: 14, textDecorationLine: 'line-through' },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  heroPrice: { fontSize: 32, fontWeight: '800' },
  coupon: {
    margin: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: { fontFamily: 'Courier', fontSize: 20, fontWeight: '800', letterSpacing: 3 },
  body: { paddingHorizontal: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  desc: { fontSize: 15, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relatedTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 16, marginBottom: 10 },
  related: { paddingHorizontal: 16, gap: 12 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, padding: 16, gap: 8 },
  cta: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryCta: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  lightbox: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 16 },
  lightboxHint: { color: 'rgba(255,255,255,0.7)' },
});
