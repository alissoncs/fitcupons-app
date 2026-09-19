import { notFound } from 'next/navigation';
import { OfferForm } from '../offer-form';
import { getOffer, listCategories, listSports, listStores } from '@/lib/data';

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [offer, stores, sports, categories] = await Promise.all([
    getOffer(id),
    listStores(),
    listSports(),
    listCategories(),
  ]);
  if (!offer) notFound();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink">Editar oferta</h1>
      <OfferForm offer={offer} stores={stores} sports={sports} categories={categories} />
    </div>
  );
}
