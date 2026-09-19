import { API_URL, DEFAULT_TIMEOUT_MS, HEALTH_TIMEOUT_MS, getClientDataMode } from './config';
import { HttpError, TimeoutError } from './errors';
import { handleMockRequest } from './mock-server';
import { clearTokens, getAccessToken, getOrCreateDeviceId, getRefreshToken, setTokens } from './storage';

export type ApiMode = 'unknown' | 'live' | 'mock';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  public?: boolean;
  timeoutMs?: number;
  skipRefresh?: boolean;
};

let mode: ApiMode = 'unknown';
let refreshInFlight: Promise<boolean> | null = null;
let onSessionCleared: (() => void) | null = null;

export function getApiMode(): ApiMode {
  return mode;
}

export function setOnSessionCleared(handler: (() => void) | null): void {
  onSessionCleared = handler;
}

function withQuery(path: string, query?: RequestOptions['query']): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function splitPath(pathWithQuery: string): { path: string; query: Record<string, string | undefined> } {
  const [path, qs] = pathWithQuery.split('?');
  const query: Record<string, string | undefined> = {};
  if (qs) {
    new URLSearchParams(qs).forEach((value, key) => {
      query[key] = value;
    });
  }
  return { path: path ?? pathWithQuery, query };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new TimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function detectApiMode(): Promise<ApiMode> {
  const forced = getClientDataMode();
  if (forced === 'mock') {
    mode = 'mock';
    return mode;
  }
  if (forced === 'live') {
    mode = 'live';
    return mode;
  }

  try {
    const response = await fetchWithTimeout(`${API_URL.replace(/\/$/, '')}/health`, { method: 'GET' }, HEALTH_TIMEOUT_MS);
    mode = response.ok ? 'live' : 'mock';
  } catch {
    mode = 'mock';
  }
  return mode;
}

function extractError(status: number, body: unknown): HttpError {
  if (body && typeof body === 'object') {
    const record = body as { code?: unknown; message?: unknown };
    const code = typeof record.code === 'string' ? record.code : 'UNKNOWN';
    const message =
      typeof record.message === 'string'
        ? record.message
        : Array.isArray(record.message)
          ? record.message.filter((item): item is string => typeof item === 'string').join(', ')
          : `Erro ${status}`;
    return new HttpError(status, code, message);
  }
  return new HttpError(status, 'UNKNOWN', `Erro ${status}`);
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;
    try {
      const tokens = await apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        public: true,
        skipRefresh: true,
      });
      await setTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      await clearTokens();
      onSessionCleared?.();
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (mode === 'unknown') {
    await detectApiMode();
  }

  const method = options.method ?? (options.body !== undefined ? 'POST' : 'GET');
  const pathWithQuery = withQuery(path, options.query);
  const accessToken = options.public ? null : await getAccessToken();

  if (mode === 'mock') {
    const { path: cleanPath, query } = splitPath(pathWithQuery);
    try {
      return await handleMockRequest<T>({
        method,
        path: cleanPath,
        query,
        body: options.body,
        accessToken,
      });
    } catch (error) {
      if (error instanceof HttpError && error.statusCode === 401 && !options.public && !options.skipRefresh) {
        const refreshed = await refreshTokens();
        if (refreshed) return apiRequest<T>(path, { ...options, skipRefresh: true });
      }
      throw error;
    }
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  headers['X-Device-Id'] = await getOrCreateDeviceId();

  const response = await fetchWithTimeout(
    `${API_URL.replace(/\/$/, '')}${pathWithQuery}`,
    {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    },
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  if (response.status === 401 && !options.public && !options.skipRefresh) {
    const refreshed = await refreshTokens();
    if (refreshed) return apiRequest<T>(path, { ...options, skipRefresh: true });
    throw extractError(401, await parseBody(response));
  }

  if (!response.ok) {
    throw extractError(response.status, await parseBody(response));
  }

  return (await parseBody(response)) as T;
}
