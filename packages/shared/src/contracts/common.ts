import type { AppliedSportFilter } from '../enums';
import type { OfferListItem } from './offer';

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ApiError = {
  statusCode: number;
  code: string;
  message: string;
};

export type OfferFeedMeta = {
  appliedSportFilter: AppliedSportFilter;
  totalHint: number | null;
};

export type OfferFeedResponse = Paginated<OfferListItem> & {
  meta: OfferFeedMeta;
};
