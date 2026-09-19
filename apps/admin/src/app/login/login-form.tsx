'use client';

import { useState } from 'react';
import { loginAction } from '@/lib/auth';

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">E-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded-[10px] border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="admin@fitcupons.app"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Senha</span>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="w-full rounded-[10px] border border-border bg-surface px-4 py-3 pr-24 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </label>
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-[10px] bg-primary px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
      {process.env.NODE_ENV !== 'production' ? (
        <p className="text-xs text-ink-muted">
          Sem API no ar, use admin@fitcupons.app / fitcupons123
        </p>
      ) : null}
    </form>
  );
}
