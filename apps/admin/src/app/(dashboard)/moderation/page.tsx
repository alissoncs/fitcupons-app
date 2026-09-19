import { formatCents } from '@fitcupons/shared';
import { listModeration } from '@/lib/data';
import { OFFER_SOURCE_LABEL } from '@/lib/labels';
import Link from 'next/link';

export default async function ModerationPage() {
  const queue = await listModeration();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Moderação</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Fila dos coletores. A / aprovar · E / editar · R / rejeitar (atalhos na próxima iteração com cliente).
      </p>
      {queue.length === 0 ? (
        <p className="mt-8 text-ink-muted">Fila vazia — nada para revisar.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queue.map((offer) => (
            <article key={offer.id} className="overflow-hidden rounded-[12px] border border-border bg-surface">
              {offer.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={offer.images[0].url} alt="" className="h-40 w-full object-cover" />
              ) : null}
              <div className="p-4">
                <p className="text-xs font-medium text-ink-muted">
                  {OFFER_SOURCE_LABEL[offer.source] ?? offer.source}
                </p>
                <h2 className="mt-1 font-semibold text-ink">{offer.title}</h2>
                <p className="mt-1 text-sm text-accent">
                  {offer.priceCents != null ? formatCents(offer.priceCents) : '—'}
                  {offer.discountPercent != null ? ` · −${offer.discountPercent}%` : ''}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/offers/${offer.id}`}
                    className="rounded-[10px] bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Aprovar
                  </Link>
                  <Link
                    href={`/offers/${offer.id}`}
                    className="rounded-[10px] bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    Editar
                  </Link>
                  <span className="rounded-[10px] px-3 py-1.5 text-xs text-ink-muted">Rejeitar</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
