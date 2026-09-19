'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_URL, ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from './config';
import { AdminApiError, parseApiError, probeApi } from './errors';

const MOCK_EMAIL = 'admin@fitcupons.app';
const MOCK_PASSWORD = 'fitcupons123';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/offers');

  if (!email || !password) {
    return { error: 'E-mail ou senha incorretos.' };
  }

  const live = await probeApi(API_URL);
  let token: string | null = null;

  if (live) {
    try {
      const response = await fetch(`${API_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const err = await parseApiError(response);
        return {
          error:
            err.status === 401 || err.code === 'INVALID_CREDENTIALS'
              ? 'E-mail ou senha incorretos.'
              : err.message,
        };
      }
      const data = (await response.json()) as { accessToken: string };
      token = data.accessToken;
    } catch {
      return { error: 'Não foi possível falar com a API. Confira API_URL e se ela está no ar.' };
    }
  } else if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
    token = 'mock-admin-token';
  } else {
    return { error: 'E-mail ou senha incorretos.' };
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });

  redirect(next.startsWith('/') ? next : '/offers');
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect('/login');
}

export async function getAdminToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value ?? null;
}

export async function requireAdminToken(): Promise<string> {
  const token = await getAdminToken();
  if (!token) redirect('/login');
  return token;
}

export async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await requireAdminToken();
  const live = await probeApi(API_URL);
  if (!live) {
    throw new AdminApiError('API offline — usando mock no servidor de dados', 503);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.body instanceof FormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new AdminApiError('Não foi possível falar com a API.', 503);
  }

  if (response.status === 401) {
    const jar = await cookies();
    jar.delete(ADMIN_COOKIE);
    redirect('/login');
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
