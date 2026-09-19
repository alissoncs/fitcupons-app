import Link from 'next/link';
import { logoutAction } from '@/lib/auth';
import { dataSourceLabel } from '@/lib/data';

const NAV = [
  { href: '/offers', label: 'Ofertas' },
  { href: '/moderation', label: 'Moderação' },
  { href: '/import', label: 'Importar' },
  { href: '/stores', label: 'Lojas' },
  { href: '/sports', label: 'Esportes' },
  { href: '/categories', label: 'Categorias' },
  { href: '/users', label: 'Usuários' },
  { href: '/ingestion', label: 'Ingestão' },
  { href: '/stats', label: 'Métricas' },
  { href: '/settings', label: 'Ajustes' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const source = await dataSourceLabel();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-5 py-5">
          <p className="text-sm font-semibold tracking-tight text-primary">fitcupons</p>
          <p className="text-xs text-ink-muted">curadoria</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[10px] px-3 py-2 text-sm text-ink hover:bg-primary-soft hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="border-t border-border p-3">
          <p className="mb-2 px-3 text-[10px] uppercase tracking-wide text-ink-muted">
            fonte: {source === 'api' ? 'API ao vivo' : 'mock'}
          </p>
          <button
            type="submit"
            className="w-full rounded-[10px] px-3 py-2 text-left text-sm text-ink-muted hover:bg-primary-soft hover:text-primary"
          >
            Sair
          </button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <p className="text-sm text-ink-muted">Painel interno — não indexável</p>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
