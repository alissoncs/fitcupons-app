import {
  discountPercent,
  savingsCents,
  type Category,
  type IngestionRun,
  type OfferListItem,
  type OfferSource,
  type OfferStatus,
  type Sport,
  type Store,
} from '@fitcupons/shared';

export type AdminStore = Store & { affiliateTag: string | null };

export type AdminOffer = OfferListItem & {
  status: OfferStatus;
  source: OfferSource;
  destinationUrl: string;
  affiliateUrl: string | null;
  description: string | null;
  clickCount: number;
  sportIds: string[];
  storeId: string;
  categoryId: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  providers: Array<'google' | 'apple' | 'email'>;
  createdAt: string;
  lastLoginAt: string | null;
  redeemCount: number;
  role: 'user' | 'admin';
  deletedAt: string | null;
};

const now = Date.now();
const hours = (h: number) => new Date(now - h * 3600_000).toISOString();
const days = (d: number) => new Date(now - d * 86400_000).toISOString();

export const mockSports: Sport[] = [
  { id: 'spt_cyc', slug: 'cycling', name: 'Ciclismo', iconName: 'bike', sortOrder: 1, active: true },
  { id: 'spt_run', slug: 'running', name: 'Corrida', iconName: 'run', sortOrder: 2, active: true },
  { id: 'spt_swm', slug: 'swimming', name: 'Natação', iconName: 'swim', sortOrder: 3, active: true },
  { id: 'spt_bt', slug: 'beach-tennis', name: 'Beach Tennis', iconName: 'tennis', sortOrder: 4, active: true },
  { id: 'spt_vol', slug: 'volleyball', name: 'Vôlei', iconName: 'volleyball', sortOrder: 5, active: true },
  { id: 'spt_tri', slug: 'triathlon', name: 'Triathlon', iconName: 'triathlon', sortOrder: 6, active: true },
  { id: 'spt_gym', slug: 'gym', name: 'Musculação', iconName: 'dumbbell', sortOrder: 7, active: true },
  { id: 'spt_cf', slug: 'crossfit', name: 'CrossFit', iconName: 'weight-lifter', sortOrder: 8, active: true },
  { id: 'spt_ftb', slug: 'football', name: 'Futebol', iconName: 'soccer', sortOrder: 9, active: true },
  { id: 'spt_bsk', slug: 'basketball', name: 'Basquete', iconName: 'basketball', sortOrder: 10, active: true },
  { id: 'spt_srf', slug: 'surfing', name: 'Surf', iconName: 'surfing', sortOrder: 11, active: true },
  { id: 'spt_trl', slug: 'trail', name: 'Trilha', iconName: 'hiking', sortOrder: 12, active: true },
  { id: 'spt_yog', slug: 'yoga', name: 'Yoga', iconName: 'yoga', sortOrder: 13, active: true },
  { id: 'spt_sup', slug: 'supplements', name: 'Suplementos', iconName: 'nutrition', sortOrder: 14, active: true },
];

export const mockCategories: Category[] = [
  { id: 'cat_foot', slug: 'footwear', name: 'Calçados', iconName: 'shoe-sneaker', color: '#5F4B8B', parentId: null, sortOrder: 1, children: [] },
  { id: 'cat_app', slug: 'apparel', name: 'Roupas', iconName: 'tshirt-crew', color: '#3E8E6B', parentId: null, sortOrder: 2, children: [] },
  { id: 'cat_sup', slug: 'supplements', name: 'Suplementos', iconName: 'bottle-tonic', color: '#8B6B4B', parentId: null, sortOrder: 3, children: [] },
  { id: 'cat_eq', slug: 'equipment', name: 'Equipamentos', iconName: 'dumbbell', color: '#4B6B8B', parentId: null, sortOrder: 4, children: [] },
  { id: 'cat_bike', slug: 'bikes', name: 'Bicicletas e peças', iconName: 'bike', color: '#6B4B8B', parentId: null, sortOrder: 5, children: [] },
  { id: 'cat_acc', slug: 'accessories', name: 'Acessórios', iconName: 'bag-personal', color: '#4B8B6B', parentId: null, sortOrder: 6, children: [] },
  { id: 'cat_wear', slug: 'wearables', name: 'Relógios e monitores', iconName: 'watch', color: '#8B4B6B', parentId: null, sortOrder: 7, children: [] },
  { id: 'cat_nut', slug: 'nutrition', name: 'Nutrição', iconName: 'food-apple', color: '#6B8B4B', parentId: null, sortOrder: 8, children: [] },
  { id: 'cat_rec', slug: 'recovery', name: 'Recuperação', iconName: 'spa', color: '#4B8B8B', parentId: null, sortOrder: 9, children: [] },
  { id: 'cat_srv', slug: 'services', name: 'Serviços e assinaturas', iconName: 'card-account-details', color: '#8B8B4B', parentId: null, sortOrder: 10, children: [] },
];

export const mockStores: AdminStore[] = [
  { id: 'str_ml', slug: 'mercado-livre', name: 'Mercado Livre', logoUrl: 'https://picsum.photos/seed/ml/64', websiteUrl: 'https://www.mercadolivre.com.br', active: true, affiliateTag: 'ALISSON3208' },
  { id: 'str_amz', slug: 'amazon', name: 'Amazon', logoUrl: 'https://picsum.photos/seed/amz/64', websiteUrl: 'https://www.amazon.com.br', active: true, affiliateTag: null },
  { id: 'str_ali', slug: 'aliexpress', name: 'AliExpress', logoUrl: 'https://picsum.photos/seed/ali/64', websiteUrl: 'https://www.aliexpress.com', active: true, affiliateTag: null },
  { id: 'str_net', slug: 'netshoes', name: 'Netshoes', logoUrl: 'https://picsum.photos/seed/net/64', websiteUrl: 'https://www.netshoes.com.br', active: true, affiliateTag: null },
  { id: 'str_cen', slug: 'centauro', name: 'Centauro', logoUrl: 'https://picsum.photos/seed/cen/64', websiteUrl: 'https://www.centauro.com.br', active: true, affiliateTag: null },
  { id: 'str_dec', slug: 'decathlon', name: 'Decathlon', logoUrl: 'https://picsum.photos/seed/dec/64', websiteUrl: 'https://www.decathlon.com.br', active: true, affiliateTag: null },
  { id: 'str_grw', slug: 'growth', name: 'Growth Supplements', logoUrl: 'https://picsum.photos/seed/grw/64', websiteUrl: 'https://www.gsuplementos.com.br', active: true, affiliateTag: null },
  { id: 'str_tf', slug: 'track-field', name: 'Track&Field', logoUrl: 'https://picsum.photos/seed/tf/64', websiteUrl: 'https://www.tf.com.br', active: true, affiliateTag: null },
];

function pic(seed: string) {
  const url = `https://picsum.photos/seed/${seed}/640/640`;
  return { url, width: 640, height: 640, blurhash: null, alt: null };
}

function offer(partial: Omit<AdminOffer, 'discountPercent' | 'savingsCents' | 'hasCoupon' | 'endingSoon' | 'isFavorite' | 'currency'> & Partial<Pick<AdminOffer, 'hasCoupon' | 'endingSoon' | 'isFavorite'>>): AdminOffer {
  const discount = discountPercent(partial.originalPriceCents ?? 0, partial.priceCents ?? 0);
  const save = savingsCents(partial.originalPriceCents ?? 0, partial.priceCents ?? 0);
  return {
    currency: 'BRL',
    hasCoupon: Boolean(partial.couponCode),
    endingSoon: Boolean(partial.expiresAt && new Date(partial.expiresAt).getTime() - now < 48 * 3600_000),
    isFavorite: false,
    discountPercent: discount,
    savingsCents: save,
    ...partial,
  };
}

export const mockOffers: AdminOffer[] = [
  offer({
    id: 'off_pegasus',
    slug: 'tenis-nike-pegasus-41-a3f9',
    title: 'Tênis Nike Pegasus 41 Masculino',
    priceCents: 39590,
    originalPriceCents: 59990,
    couponCode: 'FIT20',
    publishedAt: hours(2),
    expiresAt: new Date(now + 12 * 86400_000).toISOString(),
    featured: true,
    verified: true,
    viewCount: 128,
    clickCount: 34,
    status: 'published',
    source: 'manual',
    destinationUrl: 'https://www.netshoes.com.br/pegasus',
    affiliateUrl: 'https://www.netshoes.com.br/pegasus?tag=fit',
    description: 'Amortecimento ReactX para treinos longos. Oferta por tempo limitado.',
    storeId: 'str_net',
    categoryId: 'cat_foot',
    sportIds: ['spt_run'],
    store: { id: 'str_net', slug: 'netshoes', name: 'Netshoes', logoUrl: 'https://picsum.photos/seed/net/64' },
    category: { id: 'cat_foot', slug: 'footwear', name: 'Calçados', iconName: 'shoe-sneaker' },
    sports: [{ id: 'spt_run', slug: 'running', name: 'Corrida', iconName: 'run' }],
    images: [pic('pegasus1'), pic('pegasus2'), pic('pegasus3')],
  }),
  offer({
    id: 'off_whey',
    slug: 'whey-growth-900g',
    title: 'Whey Protein Concentrado 900g Growth',
    priceCents: 8990,
    originalPriceCents: 14990,
    couponCode: null,
    publishedAt: hours(8),
    expiresAt: new Date(now + 36 * 3600_000).toISOString(),
    featured: false,
    verified: true,
    viewCount: 410,
    clickCount: 91,
    status: 'published',
    source: 'manual',
    destinationUrl: 'https://www.gsuplementos.com.br/whey',
    affiliateUrl: null,
    description: 'Whey concentrado 80% de proteína, sabor chocolate.',
    storeId: 'str_grw',
    categoryId: 'cat_sup',
    sportIds: ['spt_gym', 'spt_sup'],
    store: { id: 'str_grw', slug: 'growth', name: 'Growth Supplements', logoUrl: 'https://picsum.photos/seed/grw/64' },
    category: { id: 'cat_sup', slug: 'supplements', name: 'Suplementos', iconName: 'bottle-tonic' },
    sports: [
      { id: 'spt_gym', slug: 'gym', name: 'Musculação', iconName: 'dumbbell' },
      { id: 'spt_sup', slug: 'supplements', name: 'Suplementos', iconName: 'nutrition' },
    ],
    images: [pic('whey1'), pic('whey2')],
  }),
  offer({
    id: 'off_bike',
    slug: 'speed-caloi-strada',
    title: 'Speed Caloi Strada 16v',
    priceCents: 289900,
    originalPriceCents: 429900,
    couponCode: 'PEDAL15',
    publishedAt: days(1),
    expiresAt: new Date(now + 20 * 86400_000).toISOString(),
    featured: true,
    verified: true,
    viewCount: 76,
    clickCount: 12,
    status: 'published',
    source: 'mercado_livre',
    destinationUrl: 'https://www.mercadolivre.com.br/caloi',
    affiliateUrl: 'https://www.mercadolivre.com.br/caloi?matt_word=ALISSON3208',
    description: 'Quadro de alumínio, 16 velocidades. Pronta entrega.',
    storeId: 'str_ml',
    categoryId: 'cat_bike',
    sportIds: ['spt_cyc'],
    store: { id: 'str_ml', slug: 'mercado-livre', name: 'Mercado Livre', logoUrl: 'https://picsum.photos/seed/ml/64' },
    category: { id: 'cat_bike', slug: 'bikes', name: 'Bicicletas e peças', iconName: 'bike' },
    sports: [{ id: 'spt_cyc', slug: 'cycling', name: 'Ciclismo', iconName: 'bike' }],
    images: [pic('bike1'), pic('bike2'), pic('bike3'), pic('bike4')],
  }),
  offer({
    id: 'off_yoga',
    slug: 'kit-yoga-decathlon',
    title: 'Kit tapete + bloco de yoga Decathlon',
    priceCents: 7990,
    originalPriceCents: 12990,
    couponCode: null,
    publishedAt: days(2),
    expiresAt: null,
    featured: false,
    verified: false,
    viewCount: 22,
    clickCount: 3,
    status: 'pending_review',
    source: 'aliexpress',
    destinationUrl: 'https://www.decathlon.com.br/yoga',
    affiliateUrl: null,
    description: 'Tapete 6mm + dois blocos de EVA.',
    storeId: 'str_dec',
    categoryId: 'cat_eq',
    sportIds: ['spt_yog'],
    store: { id: 'str_dec', slug: 'decathlon', name: 'Decathlon', logoUrl: 'https://picsum.photos/seed/dec/64' },
    category: { id: 'cat_eq', slug: 'equipment', name: 'Equipamentos', iconName: 'dumbbell' },
    sports: [{ id: 'spt_yog', slug: 'yoga', name: 'Yoga', iconName: 'yoga' }],
    images: [pic('yoga1')],
  }),
  offer({
    id: 'off_garmin',
    slug: 'garmin-forerunner-165',
    title: 'Garmin Forerunner 165',
    priceCents: 179900,
    originalPriceCents: 249900,
    couponCode: 'PACE10',
    publishedAt: days(4),
    expiresAt: new Date(now + 5 * 86400_000).toISOString(),
    featured: true,
    verified: true,
    viewCount: 201,
    clickCount: 55,
    status: 'published',
    source: 'amazon',
    destinationUrl: 'https://www.amazon.com.br/garmin',
    affiliateUrl: null,
    description: 'GPS, métricas avançadas e tela AMOLED.',
    storeId: 'str_amz',
    categoryId: 'cat_wear',
    sportIds: ['spt_run', 'spt_tri'],
    store: { id: 'str_amz', slug: 'amazon', name: 'Amazon', logoUrl: 'https://picsum.photos/seed/amz/64' },
    category: { id: 'cat_wear', slug: 'wearables', name: 'Relógios e monitores', iconName: 'watch' },
    sports: [
      { id: 'spt_run', slug: 'running', name: 'Corrida', iconName: 'run' },
      { id: 'spt_tri', slug: 'triathlon', name: 'Triathlon', iconName: 'triathlon' },
    ],
    images: [pic('garmin1'), pic('garmin2')],
  }),
  offer({
    id: 'off_draft',
    slug: 'oculos-natacao-rascunho',
    title: 'Óculos de natação Speedo Fastskin',
    priceCents: 18990,
    originalPriceCents: 24990,
    couponCode: null,
    publishedAt: null,
    expiresAt: null,
    featured: false,
    verified: false,
    viewCount: 0,
    clickCount: 0,
    status: 'draft',
    source: 'manual',
    destinationUrl: 'https://www.centauro.com.br/oculos',
    affiliateUrl: null,
    description: null,
    storeId: 'str_cen',
    categoryId: 'cat_acc',
    sportIds: ['spt_swm'],
    store: { id: 'str_cen', slug: 'centauro', name: 'Centauro', logoUrl: 'https://picsum.photos/seed/cen/64' },
    category: { id: 'cat_acc', slug: 'accessories', name: 'Acessórios', iconName: 'bag-personal' },
    sports: [{ id: 'spt_swm', slug: 'swimming', name: 'Natação', iconName: 'swim' }],
    images: [pic('goggles')],
  }),
];

export const mockUsers: AdminUser[] = [
  { id: 'usr_admin', email: 'admin@fitcupons.app', name: 'Admin', providers: ['email'], createdAt: days(40), lastLoginAt: hours(1), redeemCount: 0, role: 'admin', deletedAt: null },
  { id: 'usr_ana', email: 'ana@example.com', name: 'Ana Souza', providers: ['google', 'email'], createdAt: days(12), lastLoginAt: hours(5), redeemCount: 18, role: 'user', deletedAt: null },
  { id: 'usr_leo', email: 'leo@example.com', name: 'Léo Martins', providers: ['apple'], createdAt: days(8), lastLoginAt: days(1), redeemCount: 7, role: 'user', deletedAt: null },
];

export const mockIngestionRuns: IngestionRun[] = [
  { id: 'run_1', source: 'mercado_livre', status: 'success', startedAt: hours(6), finishedAt: hours(5.8), itemsSeen: 40, itemsCreated: 3, itemsUpdated: 12, error: null },
  { id: 'run_2', source: 'aliexpress', status: 'success', startedAt: hours(12), finishedAt: hours(11.9), itemsSeen: 0, itemsCreated: 0, itemsUpdated: 0, error: null },
  { id: 'run_3', source: 'amazon', status: 'failed', startedAt: days(1), finishedAt: days(1), itemsSeen: 0, itemsCreated: 0, itemsUpdated: 0, error: 'AMAZON_ENABLED=false' },
];

export const mockStats = {
  totals: { clicks: 312, uniqueClicks: 198, published: 4, newUsers: 8 },
  series: Array.from({ length: 14 }, (_, i) => ({
    day: days(13 - i).slice(0, 10),
    view: 20 + i * 3,
    copy_code: 4 + (i % 5),
    open_link: 8 + (i % 7),
  })),
  topOffers: mockOffers
    .filter((o) => o.status === 'published')
    .map((o) => ({ id: o.id, title: o.title, clicks: o.clickCount })),
  byStore: mockStores.slice(0, 5).map((s, i) => ({ store: s.name, clicks: 40 - i * 6 })),
  bySport: mockSports.slice(0, 6).map((s, i) => ({ sport: s.name, clicks: 30 - i * 4 })),
  viewToOpen: 0.27,
};
