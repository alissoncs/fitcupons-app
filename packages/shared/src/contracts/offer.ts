import type { OfferSource, RedeemAction } from '../enums';
import type { SportSummary } from './auth';
import type { Paginated } from './common';
import type { Category, Store } from './catalog';

export type OfferImage = {
  id: string;
  urlThumb: string;
  urlCard: string;
  urlFull: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  alt: string | null;
  sortOrder: number;
};

export type OfferImageCard = {
  url: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  alt: string | null;
};

export type OfferListItem = {
  id: string;
  slug: string;
  title: string;
  priceCents: number | null;
  originalPriceCents: number | null;
  currency: string;
  discountPercent: number | null;
  savingsCents: number | null;
  couponCode: string | null;
  hasCoupon: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  endingSoon: boolean;
  featured: boolean;
  verified: boolean;
  isFavorite: boolean;
  viewCount: number;
  store: Pick<Store, 'id' | 'slug' | 'name' | 'logoUrl'>;
  category: Pick<Category, 'id' | 'slug' | 'name' | 'iconName'> | null;
  sports: SportSummary[];
  images: OfferImageCard[];
};

export type OfferDetail = Omit<OfferListItem, 'images'> & {
  description: string | null;
  destinationUrl: string;
  affiliateUrl: string | null;
  source: OfferSource;
  startsAt: string | null;
  clickCount: number;
  images: OfferImage[];
};

export type RedeemBody = { action: RedeemAction };

export type RedeemListItem = {
  id: string;
  action: RedeemAction;
  createdAt: string;
  offer: OfferListItem;
};

export type FavoriteListResponse = Paginated<OfferListItem> & {
  total: number;
};

export type NewCountResponse = { count: number; capped?: boolean };
