export const API_URL =
  process.env.API_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:3000';

export const ADMIN_COOKIE = 'fc_admin';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 2;
