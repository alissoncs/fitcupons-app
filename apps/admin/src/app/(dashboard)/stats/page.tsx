import { getStats } from '@/lib/data';

export default async function StatsPage() {
  const stats = await getStats();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Métricas</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Cliques', stats.totals.clicks],
          ['Cliques únicos', stats.totals.uniqueClicks],
          ['Publicadas', stats.totals.published],
          ['Usuários novos', stats.totals.newUsers],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[12px] border border-border bg-surface p-4">
            <p className="text-xs uppercase text-ink-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-muted">
        Taxa view → open_link:{' '}
        <span className="font-semibold text-accent">
          {Math.round(stats.viewToOpen * 100)}%
        </span>
      </p>
      <h2 className="mt-8 text-lg font-semibold">Top ofertas</h2>
      <ul className="mt-3 divide-y divide-border rounded-[12px] border border-border bg-surface">
        {stats.topOffers.map((row) => (
          <li key={row.id} className="flex justify-between px-4 py-3 text-sm">
            <span>{row.title}</span>
            <span className="text-ink-muted">{row.clicks} cliques</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
