'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-ink">Ajustes</h1>
      <form
        className="mt-6 flex flex-col gap-3 rounded-[12px] border border-border bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage('Quando a API estiver no ar, isto chama POST /auth/password/change.');
        }}
      >
        <label className="text-sm">
          Senha atual
          <input type="password" className="mt-1 w-full rounded-[10px] border border-border px-3 py-2" />
        </label>
        <label className="text-sm">
          Nova senha
          <input type="password" className="mt-1 w-full rounded-[10px] border border-border px-3 py-2" />
        </label>
        <label className="text-sm">
          Confirmação
          <input type="password" className="mt-1 w-full rounded-[10px] border border-border px-3 py-2" />
        </label>
        <button type="submit" className="mt-2 rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white">
          Trocar senha
        </button>
        {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
      </form>
    </div>
  );
}
