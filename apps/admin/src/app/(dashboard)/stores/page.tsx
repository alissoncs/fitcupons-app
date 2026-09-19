import { listStores } from '@/lib/data';

export default async function StoresPage() {
  const stores = await listStores();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Lojas</h1>
      <div className="mt-6 overflow-hidden rounded-[12px] border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Tag afiliado</th>
              <th className="px-4 py-3 font-medium">Ativa</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{store.name}</td>
                <td className="px-4 py-3 text-ink-muted">{store.slug}</td>
                <td className="px-4 py-3">{store.affiliateTag ?? '—'}</td>
                <td className="px-4 py-3">{store.active ? 'sim' : 'não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
