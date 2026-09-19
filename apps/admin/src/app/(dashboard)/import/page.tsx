'use client';

import { useState } from 'react';

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Importar do Mercado Livre</h1>
      <p className="mt-1 text-sm text-ink-muted">
        A busca da API pode estar 403. A importação por link é o caminho que sempre funciona.
      </p>
      <div className="mt-6 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Busca indisponível — use a importação por link (mock enquanto a API não responde).
      </div>
      <form
        className="mt-6 max-w-xl rounded-[12px] border border-border bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(
            url.trim()
              ? 'Prévia mock: rascunho seria criado via POST /admin/ml/resolve quando a API estiver no ar.'
              : 'Cole uma URL de produto do Mercado Livre.',
          );
        }}
      >
        <label className="text-sm font-medium">Por link</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://produto.mercadolivre.com.br/MLB-…"
          className="mt-2 w-full rounded-[10px] border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="mt-4 rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Criar rascunho
        </button>
        {message ? <p className="mt-3 text-sm text-ink-muted">{message}</p> : null}
      </form>
    </div>
  );
}
