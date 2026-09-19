import { formatCents } from '@fitcupons/shared';
import Link from 'next/link';
import { listOffers } from '@/lib/data';
import { OFFER_STATUS_LABEL } from '@/lib/labels';

const STATUS: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-700',
  pending_review: 'bg-amber-100 text-amber-800',
  published: 'bg-accent-soft text-accent',
  expired: 'bg-zinc-100 text-zinc-400',
  archived: 'border border-border text-ink-muted',
};

export default async function OffersPage() {
  const offers = await listOffers();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Ofertas</h1>
          <p className="text-sm text-ink-muted">{offers.length} cadastradas</p>
        </div>
        <Link
          href="/offers/new"
          className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Nova oferta
        </Link>
      </div>
      {offers.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-border p-10 text-center">
          <p className="text-ink">Nenhuma oferta ainda — criar a primeira</p>
          <Link href="/offers/new" className="mt-3 inline-block text-sm text-primary">
            Criar oferta
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Oferta</th>
                <th className="px-4 py-3 font-medium">Loja</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cliques</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr
                  key={offer.id}
                  className={`border-b border-border last:border-0 ${offer.status === 'expired' ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/offers/${offer.id}`} className="flex items-center gap-3">
                      {offer.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={offer.images[0].url}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary-soft" />
                      )}
                      <span className="font-medium text-ink">{offer.title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{offer.store.name}</td>
                  <td className="px-4 py-3">
                    {offer.priceCents != null ? (
                      <span>
                        <span className="font-semibold text-ink">
                          {formatCents(offer.priceCents)}
                        </span>
                        {offer.originalPriceCents != null ? (
                          <span className="ml-2 text-ink-muted line-through">
                            {formatCents(offer.originalPriceCents)}
                          </span>
                        ) : null}
                        {offer.discountPercent != null ? (
                          <span className="ml-2 text-xs font-semibold text-accent">
                            −{offer.discountPercent}%
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[offer.status] ?? ''}`}
                    >
                      {OFFER_STATUS_LABEL[offer.status] ?? offer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{offer.clickCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
