'use client';

import { discountPercent, formatCents, savingsCents } from '@fitcupons/shared';
import { useMemo, useState } from 'react';
import type { AdminOffer } from '@/lib/mocks';
import type { Category, Sport } from '@fitcupons/shared';
import type { AdminStore } from '@/lib/mocks';

type Props = {
  offer?: AdminOffer | null;
  stores: AdminStore[];
  sports: Sport[];
  categories: Category[];
};

export function OfferForm({ offer, stores, sports, categories }: Props) {
  const [title, setTitle] = useState(offer?.title ?? '');
  const [price, setPrice] = useState(offer?.priceCents ? String(offer.priceCents / 100) : '');
  const [original, setOriginal] = useState(
    offer?.originalPriceCents ? String(offer.originalPriceCents / 100) : '',
  );
  const [coupon, setCoupon] = useState(offer?.couponCode ?? '');
  const [url, setUrl] = useState(offer?.destinationUrl ?? '');
  const [sportIds, setSportIds] = useState<string[]>(offer?.sportIds ?? []);
  const [storeId, setStoreId] = useState(offer?.storeId ?? stores[0]?.id ?? '');
  const [message, setMessage] = useState<string | null>(null);

  const priceCents = Math.round(Number(price.replace(',', '.')) * 100) || 0;
  const originalCents = Math.round(Number(original.replace(',', '.')) * 100) || 0;
  const pct = useMemo(
    () => (originalCents && priceCents ? discountPercent(originalCents, priceCents) : null),
    [originalCents, priceCents],
  );
  const save = useMemo(
    () => (originalCents && priceCents ? savingsCents(originalCents, priceCents) : null),
    [originalCents, priceCents],
  );
  const store = stores.find((s) => s.id === storeId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form
        className="flex flex-col gap-4 rounded-[12px] border border-border bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title || sportIds.length < 1 || !url.startsWith('https://')) {
            setMessage('Preencha título, ao menos um esporte e URL https://');
            return;
          }
          setMessage('Salvo no mock. Com a API no ar, isto chama POST/PATCH /admin/offers.');
        }}
      >
        <label className="text-sm">
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-[10px] border border-border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Loja
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="mt-1 w-full rounded-[10px] border border-border px-3 py-2"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Categoria
          <select defaultValue={offer?.categoryId ?? ''} className="mt-1 w-full rounded-[10px] border border-border px-3 py-2">
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm">Esportes (ao menos 1)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {sports.map((s) => {
              const on = sportIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    setSportIds((ids) => (on ? ids.filter((id) => id !== s.id) : [...ids, s.id]))
                  }
                  className={`rounded-full px-3 py-1 text-xs ${on ? 'bg-primary text-white' : 'bg-primary-soft text-primary'}`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Preço original (R$)
            <input
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              className="mt-1 w-full rounded-[10px] border border-border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Preço atual (R$)
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-[10px] border border-border px-3 py-2"
            />
          </label>
        </div>
        {priceCents > originalCents && originalCents > 0 ? (
          <p className="text-sm text-red-600">O preço atual está maior que o original.</p>
        ) : null}
        {pct != null ? <p className="text-sm font-semibold text-accent">−{pct}%</p> : null}
        <label className="text-sm">
          Cupom
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-[10px] border border-border px-3 py-2 uppercase"
          />
        </label>
        <label className="text-sm">
          URL de destino
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className="mt-1 w-full rounded-[10px] border border-border px-3 py-2"
          />
        </label>
        <p className="text-xs text-ink-muted">
          Imagens sobem depois do primeiro save — numa oferta nova, salve antes de enviar fotos.
        </p>
        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface py-3">
          <button type="submit" className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white">
            Salvar rascunho
          </button>
          <button type="button" className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-white">
            Publicar
          </button>
        </div>
        {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
      </form>
      <aside className="rounded-[12px] border border-border bg-surface p-4">
        <p className="text-xs uppercase text-ink-muted">Prévia do card</p>
        <div className="mt-3 overflow-hidden rounded-[12px] border border-border">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary-soft" />
            <div>
              <p className="text-sm font-semibold">{store?.name ?? 'Loja'}</p>
              <p className="text-xs text-ink-muted">agora</p>
            </div>
          </div>
          <div className="relative aspect-square bg-primary-soft">
            {pct != null ? (
              <span className="absolute right-2 top-2 rounded-md bg-accent px-2 py-1 text-xs font-bold text-white">
                −{pct}%
              </span>
            ) : null}
          </div>
          <div className="p-3">
            {priceCents ? (
              <p className="text-lg font-bold">
                {formatCents(priceCents)}
                {originalCents ? (
                  <span className="ml-2 text-sm font-normal text-ink-muted line-through">
                    {formatCents(originalCents)}
                  </span>
                ) : null}
              </p>
            ) : null}
            {save ? <p className="text-xs text-accent">Economize {formatCents(save)}</p> : null}
            <p className="mt-1 line-clamp-2 text-sm">{title || 'Título da oferta'}</p>
            {coupon ? (
              <p className="mt-2 rounded-full border border-dashed border-primary px-2 py-0.5 text-xs text-primary">
                {coupon}
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
