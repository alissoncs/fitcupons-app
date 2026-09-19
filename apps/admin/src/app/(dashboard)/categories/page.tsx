import { listCategories } from '@/lib/data';

export default async function CategoriesPage() {
  const categories = await listCategories();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Categorias</h1>
      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-[12px] border border-border bg-surface">
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-ink">{cat.name}</p>
              <p className="text-xs text-ink-muted">
                {cat.slug} · {cat.iconName}
              </p>
            </div>
            <span
              className="h-4 w-4 rounded-full border border-border"
              style={{ background: cat.color ?? '#ccc' }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
