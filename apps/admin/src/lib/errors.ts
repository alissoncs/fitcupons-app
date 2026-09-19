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

export async function probeApi(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1200),
    });
    return response.ok;
  } catch {
    return false;
  }
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
