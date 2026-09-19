import type {
  AppliedSportFilter,
  AuthProvider,
  AuthTokens,
  FavoriteListResponse,
  MeResponse,
  OfferDetail,
  OfferFeedResponse,
  OfferListItem,
  OfferSort,
  RedeemAction,
  RedeemListItem,
} from '@fitcupons/shared';

import { HttpError } from './errors';
import { mockCategories, mockOffers, mockSports, mockStores } from './mocks';

type MockUser = MeResponse & { password?: string };

type MockRequest = {
  method: string;
  path: string;
  query: Record<string, string | undefined>;
  body?: unknown;
  accessToken: string | null;
};

const users = new Map<string, MockUser>();
const accessToUser = new Map<string, string>();
const refreshToUser = new Map<string, string>();
const favorites = new Map<string, Set<string>>();
const redeems: RedeemListItem[] = [];
const offerState = mockOffers.map((offer) => ({ ...offer }));

function cloneOffer(offer: OfferDetail, isFavorite: boolean): OfferDetail {
  return { ...offer, isFavorite, sports: [...offer.sports], images: [...offer.images] };
}

function toListItem(offer: OfferDetail, isFavorite: boolean): OfferListItem {
  const detail = cloneOffer(offer, isFavorite);
  return {
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    priceCents: detail.priceCents,
    originalPriceCents: detail.originalPriceCents,
    currency: detail.currency,
    discountPercent: detail.discountPercent,
    savingsCents: detail.savingsCents,
    couponCode: detail.couponCode,
    hasCoupon: detail.hasCoupon,
    publishedAt: detail.publishedAt,
    expiresAt: detail.expiresAt,
    endingSoon: detail.endingSoon,
    featured: detail.featured,
    verified: detail.verified,
    isFavorite,
    viewCount: detail.viewCount,
    store: detail.store,
    category: detail.category,
    sports: detail.sports,
    images: detail.images.slice(0, 5).map((image) => ({
      url: image.urlCard,
      width: image.width,
      height: image.height,
      blurhash: image.blurhash,
      alt: image.alt,
    })),
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function tokensFor(userId: string): AuthTokens {
  const accessToken = `mock-access-${userId}-${Math.random().toString(36).slice(2, 8)}`;
  const refreshToken = `mock-refresh-${userId}-${Math.random().toString(36).slice(2, 8)}`;
  accessToUser.set(accessToken, userId);
  refreshToUser.set(refreshToken, userId);
  return { accessToken, refreshToken };
}

function requireUser(accessToken: string | null): MockUser {
  if (!accessToken) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Faça login para continuar.');
  }
  const userId = accessToUser.get(accessToken);
  const user = userId ? users.get(userId) : undefined;
  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Sessão expirada.');
  }
  return user;
}

function optionalUser(accessToken: string | null): MockUser | null {
  if (!accessToken) return null;
  try {
    return requireUser(accessToken);
  } catch {
    return null;
  }
}

function createUser(partial: {
  email: string;
  name: string | null;
  providers: AuthProvider[];
  hasPassword: boolean;
  password?: string;
  emailVerified?: boolean;
}): MockUser {
  const id = `usr_${Math.random().toString(36).slice(2, 10)}`;
  const user: MockUser = {
    id,
    email: partial.email,
    name: partial.name,
    avatarUrl: null,
    role: 'user',
    emailVerified: partial.emailVerified ?? false,
    onboarded: false,
    hasPassword: partial.hasPassword,
    providers: partial.providers,
    sports: [],
    password: partial.password,
  };
  users.set(id, user);
  favorites.set(id, new Set());
  return user;
}

function parseSort(value: string | undefined): OfferSort {
  if (value === 'discount' || value === 'popular' || value === 'recent') return value;
  return 'recent';
}

function filterOffers(query: Record<string, string | undefined>, user: MockUser | null): {
  items: OfferDetail[];
  appliedSportFilter: AppliedSportFilter;
} {
  const now = Date.now();
  let items = offerState.filter((offer) => {
    if (offer.expiresAt && new Date(offer.expiresAt).getTime() <= now) return false;
    return true;
  });

  const sportsParam = query.sports;
  let appliedSportFilter: AppliedSportFilter = 'none';

  if (sportsParam === 'all' || sportsParam === '') {
    appliedSportFilter = 'none';
  } else if (sportsParam) {
    const slugs = sportsParam.split(',').map((slug) => slug.trim()).filter(Boolean);
    items = items.filter((offer) => offer.sports.some((sport) => slugs.includes(sport.slug)));
    appliedSportFilter = 'explicit';
  } else if (user?.onboarded && user.sports.length > 0) {
    const slugs = new Set(user.sports.map((sport) => sport.slug));
    items = items.filter((offer) => offer.sports.some((sport) => slugs.has(sport.slug)));
    appliedSportFilter = 'preferences';
  }

  if (query.categoryId) {
    items = items.filter((offer) => offer.category?.id === query.categoryId);
  }
  if (query.storeId) {
    items = items.filter((offer) => offer.store.id === query.storeId);
  }
  if (query.search && query.search.trim().length >= 2) {
    const term = query.search.trim().toLowerCase();
    items = items.filter(
      (offer) =>
        offer.title.toLowerCase().includes(term) || offer.store.name.toLowerCase().includes(term),
    );
  }
  if (query.minDiscount) {
    const min = Number(query.minDiscount);
    items = items.filter((offer) => (offer.discountPercent ?? 0) >= min);
  }
  if (query.minPriceCents) {
    const min = Number(query.minPriceCents);
    items = items.filter((offer) => (offer.priceCents ?? 0) >= min);
  }
  if (query.maxPriceCents) {
    const max = Number(query.maxPriceCents);
    items = items.filter((offer) => (offer.priceCents ?? Infinity) <= max);
  }
  if (query.hasCoupon === 'true') {
    items = items.filter((offer) => offer.hasCoupon);
  }
  if (query.excludeOfferId) {
    items = items.filter((offer) => offer.id !== query.excludeOfferId);
  }

  const sort = parseSort(query.sort);
  items = [...items].sort((a, b) => {
    if (sort === 'discount') return (b.discountPercent ?? -1) - (a.discountPercent ?? -1);
    if (sort === 'popular') return b.viewCount - a.viewCount;
    return new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime();
  });

  return { items, appliedSportFilter };
}

function paginate(items: OfferDetail[], query: Record<string, string | undefined>, user: MockUser | null) {
  const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10) || 10));
  const start = query.cursor ? Number(query.cursor) || 0 : 0;
  const page = items.slice(start, start + limit);
  const favoriteSet = user ? favorites.get(user.id) ?? new Set<string>() : new Set<string>();
  return {
    items: page.map((offer) => toListItem(offer, favoriteSet.has(offer.id))),
    nextCursor: start + limit < items.length ? String(start + limit) : null,
  };
}

function asBody<T>(body: unknown): T {
  return (body ?? {}) as T;
}

export async function handleMockRequest<T>(request: MockRequest): Promise<T> {
  const { method, path, query, body, accessToken } = request;

  if (method === 'GET' && path === '/health') {
    return { status: 'ok', db: 'mock' } as T;
  }

  if (method === 'POST' && path === '/auth/email/login') {
    const { email, password } = asBody<{ email?: string; password?: string }>(body);
    if (!email || !isValidEmail(email) || !password || password.length < 8 || password === 'wrong') {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
    }
    const existing = [...users.values()].find((user) => user.email.toLowerCase() === email.toLowerCase());
    const user =
      existing ??
      createUser({
        email,
        name: email.split('@')[0] ?? null,
        providers: ['email'],
        hasPassword: true,
        password,
        emailVerified: false,
      });
    return tokensFor(user.id) as T;
  }

  if (method === 'POST' && path === '/auth/email/register') {
    const { email, password, name } = asBody<{ email?: string; password?: string; name?: string }>(body);
    if (!email || !isValidEmail(email) || !password || password.length < 8 || !name?.trim()) {
      throw new HttpError(400, 'INVALID_FILTER', 'Preencha nome, e-mail e senha (mínimo 8).');
    }
    const taken = [...users.values()].some((user) => user.email.toLowerCase() === email.toLowerCase());
    if (taken) {
      throw new HttpError(409, 'EMAIL_TAKEN', 'Já existe uma conta com esse e-mail.');
    }
    const user = createUser({
      email,
      name: name.trim(),
      providers: ['email'],
      hasPassword: true,
      password,
      emailVerified: false,
    });
    return tokensFor(user.id) as T;
  }

  if (method === 'POST' && path === '/auth/google') {
    const email = 'google.user@fitcupons.app';
    const existing = [...users.values()].find((user) => user.email === email);
    const user =
      existing ??
      createUser({
        email,
        name: 'Usuário Google',
        providers: ['google'],
        hasPassword: false,
        emailVerified: true,
      });
    if (!user.providers.includes('google')) user.providers.push('google');
    return tokensFor(user.id) as T;
  }

  if (method === 'POST' && path === '/auth/apple') {
    const email = 'apple.user@fitcupons.app';
    const existing = [...users.values()].find((user) => user.email === email);
    const user =
      existing ??
      createUser({
        email,
        name: 'Usuário Apple',
        providers: ['apple'],
        hasPassword: false,
        emailVerified: true,
      });
    if (!user.providers.includes('apple')) user.providers.push('apple');
    return tokensFor(user.id) as T;
  }

  if (method === 'POST' && path === '/auth/refresh') {
    const { refreshToken } = asBody<{ refreshToken?: string }>(body);
    const userId = refreshToken ? refreshToUser.get(refreshToken) : undefined;
    if (!userId || !users.get(userId)) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Sessão expirada.');
    }
    refreshToUser.delete(refreshToken!);
    return tokensFor(userId) as T;
  }

  if (method === 'POST' && path === '/auth/password/forgot') {
    return undefined as T;
  }

  if (method === 'POST' && path === '/auth/email/resend-verification') {
    return undefined as T;
  }

  if (method === 'POST' && path === '/auth/email/verify') {
    const { token } = asBody<{ token?: string }>(body);
    const user = optionalUser(accessToken) ?? [...users.values()][0];
    if (user && token) user.emailVerified = true;
    return undefined as T;
  }

  if (method === 'POST' && path === '/auth/password/reset') {
    const { token, password } = asBody<{ token?: string; password?: string }>(body);
    if (!token || !password || password.length < 8) {
      throw new HttpError(400, 'INVALID_FILTER', 'Token ou senha inválidos.');
    }
    return undefined as T;
  }

  if (method === 'GET' && path === '/auth/me') {
    const user = requireUser(accessToken);
    const { password: _password, ...publicUser } = user;
    return publicUser as T;
  }

  if (method === 'PATCH' && path === '/auth/me') {
    const user = requireUser(accessToken);
    const { name, avatarUrl } = asBody<{ name?: string; avatarUrl?: string }>(body);
    if (name !== undefined) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    const { password: _password, ...publicUser } = user;
    return publicUser as T;
  }

  if (method === 'DELETE' && path === '/auth/me') {
    const user = requireUser(accessToken);
    users.delete(user.id);
    return undefined as T;
  }

  if (method === 'POST' && path === '/auth/password/change') {
    const user = requireUser(accessToken);
    const { newPassword } = asBody<{ currentPassword?: string; newPassword?: string }>(body);
    if (!newPassword || newPassword.length < 8) {
      throw new HttpError(400, 'INVALID_FILTER', 'A nova senha precisa ter no mínimo 8 caracteres.');
    }
    user.password = newPassword;
    user.hasPassword = true;
    if (!user.providers.includes('email')) user.providers.push('email');
    return undefined as T;
  }

  if (method === 'POST' && path === '/auth/logout') {
    if (accessToken) accessToUser.delete(accessToken);
    return undefined as T;
  }

  if (method === 'GET' && path === '/sports') {
    return mockSports.filter((sport) => sport.active) as T;
  }

  if (method === 'GET' && path === '/categories') {
    return mockCategories as T;
  }

  if (method === 'GET' && path === '/stores') {
    return mockStores.filter((store) => store.active) as T;
  }

  if (method === 'PUT' && path === '/me/sports') {
    const user = requireUser(accessToken);
    const { sportIds } = asBody<{ sportIds?: string[] }>(body);
    if (!sportIds?.length) {
      throw new HttpError(400, 'INVALID_FILTER', 'Escolha ao menos um esporte.');
    }
    user.sports = mockSports
      .filter((sport) => sportIds.includes(sport.id))
      .map((sport) => ({
        id: sport.id,
        slug: sport.slug,
        name: sport.name,
        iconName: sport.iconName,
      }));
    user.onboarded = true;
    const { password: _password, ...publicUser } = user;
    return publicUser as T;
  }

  if (method === 'GET' && path === '/offers/new-count') {
    const user = optionalUser(accessToken);
    const { items } = filterOffers(query, user);
    const since = query.since ? new Date(query.since).getTime() : 0;
    const count = items.filter((offer) => new Date(offer.publishedAt ?? 0).getTime() > since).length;
    return { count, capped: false } as T;
  }

  if (method === 'GET' && path === '/offers') {
    const user = optionalUser(accessToken);
    const { items, appliedSportFilter } = filterOffers(query, user);
    const page = paginate(items, query, user);
    const response: OfferFeedResponse = {
      ...page,
      meta: {
        appliedSportFilter,
        totalHint: query.includeTotal === 'true' ? items.length : null,
      },
    };
    return response as T;
  }

  if (method === 'GET' && path.startsWith('/offers/')) {
    const slug = path.slice('/offers/'.length);
    const user = optionalUser(accessToken);
    const offer = offerState.find((item) => item.slug === slug || item.id === slug);
    if (!offer) throw new HttpError(404, 'NOT_FOUND', 'Oferta não encontrada.');
    const favoriteSet = user ? favorites.get(user.id) ?? new Set<string>() : new Set<string>();
    return cloneOffer(offer, favoriteSet.has(offer.id)) as T;
  }

  if (method === 'POST' && /\/offers\/[^/]+\/redeem$/.test(path)) {
    const id = path.split('/')[2];
    const offer = offerState.find((item) => item.id === id);
    if (!offer) throw new HttpError(404, 'NOT_FOUND', 'Oferta não encontrada.');
    const { action } = asBody<{ action?: RedeemAction }>(body);
    if (!action) throw new HttpError(400, 'INVALID_FILTER', 'Ação inválida.');
    if (action === 'view') offer.viewCount += 1;
    else offer.clickCount += 1;
    const user = optionalUser(accessToken);
    if (user) {
      redeems.unshift({
        id: `rdm_${Date.now().toString(36)}`,
        action,
        createdAt: new Date().toISOString(),
        offer: toListItem(offer, favorites.get(user.id)?.has(offer.id) ?? false),
      });
    }
    return undefined as T;
  }

  if (method === 'PUT' && /\/offers\/[^/]+\/favorite$/.test(path)) {
    const user = requireUser(accessToken);
    const id = path.split('/')[2];
    favorites.get(user.id)?.add(id);
    return undefined as T;
  }

  if (method === 'DELETE' && /\/offers\/[^/]+\/favorite$/.test(path)) {
    const user = requireUser(accessToken);
    const id = path.split('/')[2];
    favorites.get(user.id)?.delete(id);
    return undefined as T;
  }

  if (method === 'GET' && path === '/me/favorites') {
    const user = requireUser(accessToken);
    const ids = favorites.get(user.id) ?? new Set<string>();
    const items = offerState
      .filter((offer) => ids.has(offer.id))
      .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())
      .map((offer) => toListItem(offer, true));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10) || 10));
    const start = query.cursor ? Number(query.cursor) || 0 : 0;
    const response: FavoriteListResponse = {
      items: items.slice(start, start + limit),
      nextCursor: start + limit < items.length ? String(start + limit) : null,
      total: items.length,
    };
    return response as T;
  }

  if (method === 'GET' && path === '/me/redeems') {
    const user = requireUser(accessToken);
    const mine = redeems.filter((item) => {
      void user;
      return true;
    });
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20) || 20));
    const start = query.cursor ? Number(query.cursor) || 0 : 0;
    return {
      items: mine.slice(start, start + limit),
      nextCursor: start + limit < mine.length ? String(start + limit) : null,
    } as T;
  }

  throw new HttpError(404, 'NOT_FOUND', 'Rota mock não encontrada.');
}
