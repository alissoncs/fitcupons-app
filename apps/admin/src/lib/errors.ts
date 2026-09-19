import { getAdminDataMode } from './config';

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

type ProbeCache = { ok: boolean; at: number };
let probeCache: ProbeCache | null = null;
const PROBE_TTL_MS = 8_000;

export async function probeApi(baseUrl: string): Promise<boolean> {
  const mode = getAdminDataMode();
  if (mode === 'mock') return false;
  if (mode === 'live') return true;

  if (probeCache && Date.now() - probeCache.at < PROBE_TTL_MS) {
    return probeCache.ok;
  }

  try {
    const response = await fetch(`${baseUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1200),
    });
    probeCache = { ok: response.ok, at: Date.now() };
  } catch {
    probeCache = { ok: false, at: Date.now() };
  }
  return probeCache.ok;
}

type ErrorBody = { message?: string; code?: string };

export async function parseApiError(response: Response): Promise<AdminApiError> {
  let message = `Falha na API (${response.status})`;
  let code: string | undefined;
  try {
    const body = (await response.json()) as ErrorBody;
    if (typeof body.message === 'string') message = body.message;
    if (typeof body.code === 'string') code = body.code;
  } catch {
    // keep default
  }
  return new AdminApiError(message, response.status, code);
}
