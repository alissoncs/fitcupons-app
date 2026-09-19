import { OfferForm } from '../offer-form';
import { listCategories, listSports, listStores } from '@/lib/data';

export default async function NewOfferPage() {
  const [stores, sports, categories] = await Promise.all([
    listStores(),
    listSports(),
    listCategories(),
  ]);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink">Nova oferta</h1>
      <OfferForm stores={stores} sports={sports} categories={categories} />
    </div>
  );
}
