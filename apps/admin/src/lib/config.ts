export const API_URL =
  process.env.API_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:3000';

export const ADMIN_COOKIE = 'fc_admin';

const parsedCookieMaxAge = Number(process.env.ADMIN_COOKIE_MAX_AGE_SECONDS);
export const ADMIN_COOKIE_MAX_AGE =
  Number.isFinite(parsedCookieMaxAge) && parsedCookieMaxAge > 0 ? parsedCookieMaxAge : 60 * 60 * 2;

export type AdminDataMode = 'auto' | 'mock' | 'live';

export function getAdminDataMode(): AdminDataMode {
  const raw = (process.env.ADMIN_USE_MOCK ?? 'auto').trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'mock') return 'mock';
  if (raw === 'false' || raw === '0' || raw === 'live') return 'live';
  return 'auto';
}
