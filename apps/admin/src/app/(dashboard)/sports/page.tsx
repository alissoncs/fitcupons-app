import { listSports } from '@/lib/data';

export default async function SportsPage() {
  const sports = await listSports();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Esportes</h1>
      <p className="mt-1 text-sm text-ink-muted">
        iconName precisa ser um MaterialCommunityIcons válido — prévia no app.
      </p>
      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-[12px] border border-border bg-surface">
        {sports.map((sport) => (
          <li key={sport.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-ink">{sport.name}</p>
              <p className="text-xs text-ink-muted">
                {sport.slug} · {sport.iconName}
              </p>
            </div>
            <span className="text-xs text-ink-muted">{sport.active ? 'ativo' : 'off'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
