import type { IngestionStatus, OfferSource } from '../enums';

export type NormalizedOffer = {
  source: OfferSource;
  externalId: string;
  title: string;
  description?: string;
  destinationUrl: string;
  affiliateUrl?: string;
  priceCents?: number;
  originalPriceCents?: number;
  currency: 'BRL';
  couponCode?: string;
  imageUrls: string[];
  storeSlug: string;
  externalCategoryId?: string;
  expiresAt?: string;
};

export type OfferConnector = {
  readonly source: OfferSource;
  isConfigured(): boolean;
  fetchOffers(cursor?: string): Promise<NormalizedOffer[]>;
};

export type IngestionRun = {
  id: string;
  source: OfferSource;
  status: IngestionStatus;
  startedAt: string;
  finishedAt: string | null;
  itemsSeen: number;
  itemsCreated: number;
  itemsUpdated: number;
  error: string | null;
};
