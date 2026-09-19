import type {
  AuthTokens,
  Category,
  FavoriteListResponse,
  MeResponse,
  NewCountResponse,
  OfferDetail,
  OfferFeedResponse,
  OfferSort,
  Paginated,
  RedeemAction,
  RedeemListItem,
  Sport,
  Store,
} from '@fitcupons/shared';

import { apiRequest } from './http';

export type OfferQuery = {
  limit?: number;
  cursor?: string | null;
  sort?: OfferSort;
  sports?: string;
  categoryId?: string;
  storeId?: string;
  search?: string;
  minDiscount?: number;
  minPriceCents?: number;
  maxPriceCents?: number;
  hasCoupon?: boolean;
  includeTotal?: boolean;
  excludeOfferId?: string;
  since?: string;
};

function compactQuery(query?: OfferQuery): Record<string, string | number | boolean | undefined> {
  if (!query) return {};
  return {
    limit: query.limit,
    cursor: query.cursor ?? undefined,
    sort: query.sort,
    sports: query.sports,
    categoryId: query.categoryId,
    storeId: query.storeId,
    search: query.search,
    minDiscount: query.minDiscount,
    minPriceCents: query.minPriceCents,
    maxPriceCents: query.maxPriceCents,
    hasCoupon: query.hasCoupon ? true : undefined,
    includeTotal: query.includeTotal ? true : undefined,
    excludeOfferId: query.excludeOfferId,
    since: query.since,
  };
}

export const api = {
  loginEmail: (email: string, password: string) =>
    apiRequest<AuthTokens>('/auth/email/login', { method: 'POST', body: { email, password }, public: true }),

  registerEmail: (name: string, email: string, password: string) =>
    apiRequest<AuthTokens>('/auth/email/register', {
      method: 'POST',
      body: { email, password, name },
      public: true,
    }),

  loginGoogle: (idToken: string) =>
    apiRequest<AuthTokens>('/auth/google', { method: 'POST', body: { idToken }, public: true }),

  loginApple: (identityToken: string, authorizationCode?: string) =>
    apiRequest<AuthTokens>('/auth/apple', {
      method: 'POST',
      body: { identityToken, authorizationCode },
      public: true,
    }),

  forgotPassword: (email: string) =>
    apiRequest<void>('/auth/password/forgot', { method: 'POST', body: { email }, public: true }),

  resetPassword: (token: string, password: string) =>
    apiRequest<void>('/auth/password/reset', { method: 'POST', body: { token, password }, public: true }),

  verifyEmail: (token: string) =>
    apiRequest<void>('/auth/email/verify', { method: 'POST', body: { token }, public: true }),

  resendVerification: (email: string) =>
    apiRequest<void>('/auth/email/resend-verification', { method: 'POST', body: { email }, public: true }),

  changePassword: (newPassword: string, currentPassword?: string) =>
    apiRequest<void>('/auth/password/change', { method: 'POST', body: { newPassword, currentPassword } }),

  me: () => apiRequest<MeResponse>('/auth/me'),

  updateMe: (body: { name?: string; avatarUrl?: string }) =>
    apiRequest<MeResponse>('/auth/me', { method: 'PATCH', body }),

  deleteMe: () => apiRequest<void>('/auth/me', { method: 'DELETE' }),

  logout: (refreshToken: string) =>
    apiRequest<void>('/auth/logout', { method: 'POST', body: { refreshToken }, public: true }),

  sports: () => apiRequest<Sport[]>('/sports', { public: true }),

  categories: () => apiRequest<Category[]>('/categories', { public: true }),

  stores: () => apiRequest<Store[]>('/stores', { public: true }),

  setSports: (sportIds: string[]) => apiRequest<MeResponse>('/me/sports', { method: 'PUT', body: { sportIds } }),

  offers: (query?: OfferQuery) => apiRequest<OfferFeedResponse>('/offers', { query: compactQuery(query) }),

  offer: (slug: string) => apiRequest<OfferDetail>(`/offers/${slug}`),

  newCount: (query: OfferQuery & { since: string }) =>
    apiRequest<NewCountResponse>('/offers/new-count', { query: compactQuery(query) }),

  redeem: (id: string, action: RedeemAction) =>
    apiRequest<void>(`/offers/${id}/redeem`, { method: 'POST', body: { action } }),

  favorite: (id: string) => apiRequest<void>(`/offers/${id}/favorite`, { method: 'PUT' }),

  unfavorite: (id: string) => apiRequest<void>(`/offers/${id}/favorite`, { method: 'DELETE' }),

  favorites: (cursor?: string | null) =>
    apiRequest<FavoriteListResponse>('/me/favorites', { query: { limit: 20, cursor: cursor ?? undefined } }),

  redeems: (cursor?: string | null) =>
    apiRequest<Paginated<RedeemListItem>>('/me/redeems', { query: { limit: 30, cursor: cursor ?? undefined } }),
};
