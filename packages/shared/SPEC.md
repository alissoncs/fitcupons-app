# packages/shared — Especificação

Pacote `@fitcupons/shared`. Código que a API, o admin e o mobile precisam enxergar igual.

**Este arquivo é o contrato congelado.** Os três agentes leem daqui os nomes de campo, os enums e os tokens. Ninguém inventa `price` se o contrato diz `priceCents`. Ninguém calcula desconto localmente se o feed já manda `discountPercent` e `savingsCents`.

**Regra de entrada:** só entra aqui o que **os três** (ou ao menos dois) consomem, e que quebra silenciosamente se divergir. Utilitário usado por um app só mora no app.

**Quem escreve o pacote:** o Agente API, no primeiro commit — antes de Nest, Prisma ou qualquer tela. Admin e mobile só importam. Se um tipo faltar, o agente de UI **para e reporta**; não completa o contrato por conta própria.

---

## Conteúdo

```
src/
├── index.ts              reexporta tudo
├── theme.ts
├── enums.ts
├── sports.ts
├── categories.ts
├── format.ts
└── contracts/
    ├── common.ts
    ├── auth.ts
    ├── offer.ts
    ├── catalog.ts        Sport, Category, Store
    └── ingestion.ts      NormalizedOffer
```

---

## `enums.ts`

Uniões de string — **não** o enum gerado pelo Prisma, para não arrastar `@prisma/client` ao bundle do mobile. Espelham `apps/api/prisma/schema.prisma` 1:1. Se o schema ganhar um valor, este arquivo ganha no mesmo PR.

```ts
export type AuthProvider = 'google' | 'apple' | 'email';
export type UserRole = 'user' | 'admin';
export type OfferStatus = 'draft' | 'pending_review' | 'published' | 'expired' | 'archived';
export type OfferSource = 'manual' | 'amazon' | 'mercado_livre' | 'aliexpress' | 'telegram' | 'whatsapp';
export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'none';
export type RedeemAction = 'view' | 'copy_code' | 'open_link';
export type TokenPurpose = 'email_verification' | 'password_reset';
export type IngestionStatus = 'running' | 'success' | 'failed';
export type MessageChannel = 'telegram' | 'whatsapp';
export type OfferSort = 'recent' | 'discount' | 'popular';
export type AppliedSportFilter = 'preferences' | 'explicit' | 'none';
```

---

## `sports.ts` e `categories.ts`

Catálogo canônico do seed. Fonte do `prisma/seed.ts` e fallback do onboarding mobile se `GET /sports` falhar.

Slugs de Sport e de Category **vivem em namespaces diferentes**. Podem coincidir na string (`supplements` existe nos dois) — o filtro de esporte usa slug; o de categoria usa `categoryId`. Nunca mandar um slug de esporte em `categoryId`.

**Sports** (`iconName` = `MaterialCommunityIcons`):

| slug | name | iconName |
|---|---|---|
| `cycling` | Ciclismo | `bike` |
| `running` | Corrida | `run` |
| `swimming` | Natação | `swim` |
| `beach-tennis` | Beach Tennis | `tennis` |
| `volleyball` | Vôlei | `volleyball` |
| `triathlon` | Triathlon | `triathlon` |
| `gym` | Musculação | `dumbbell` |
| `crossfit` | CrossFit | `weight-lifter` |
| `football` | Futebol | `soccer` |
| `basketball` | Basquete | `basketball` |
| `surfing` | Surf | `surfing` |
| `trail` | Trilha | `hiking` |
| `yoga` | Yoga | `yoga` |
| `supplements` | Suplementos | `nutrition` |

**Categories** (nível 1 do seed):

| slug | name | iconName |
|---|---|---|
| `footwear` | Calçados | `shoe-sneaker` |
| `apparel` | Roupas | `tshirt-crew` |
| `supplements` | Suplementos | `bottle-tonic` |
| `equipment` | Equipamentos | `dumbbell` |
| `bikes` | Bicicletas e peças | `bike` |
| `accessories` | Acessórios | `bag-personal` |
| `wearables` | Relógios e monitores | `watch` |
| `nutrition` | Nutrição | `food-apple` |
| `recovery` | Recuperação | `spa` |
| `services` | Serviços e assinaturas | `card-account-details` |

```ts
export const SPORTS: readonly { slug: string; name: string; iconName: string }[];
export const CATEGORIES: readonly { slug: string; name: string; iconName: string }[];
```

---

## `theme.ts`

Fonte única da identidade visual. Admin (prévia do card) e mobile (app) leem daqui. Roxo = marca/navegação; **verde só economia**.

```ts
export type ThemeTokens = {
  bg: string;
  surface: string;
  border: string;
  ink: string;
  inkMuted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
};

export const lightTheme: ThemeTokens = {
  bg: '#FBFAFD',
  surface: '#FFFFFF',
  border: '#E7E4EF',
  ink: '#17141F',
  inkMuted: '#6E697D',
  primary: '#5F4B8B',
  primarySoft: '#EFEBF7',
  accent: '#3E8E6B',
  accentSoft: '#E4F1EB',
};

export const darkTheme: ThemeTokens = {
  bg: '#141119',
  surface: '#1D1926',
  border: '#2E2839',
  ink: '#F2F0F7',
  inkMuted: '#A29DB2',
  primary: '#A38FD6',
  primarySoft: '#2A2338',
  accent: '#6DBF97',
  accentSoft: '#1C3329',
};

export const radius = { card: 12, button: 10 } as const;
```

---

## `format.ts`

Uma implementação. API grava `discountPercent` com esta função; admin e mobile só formatam o que já veio.

```ts
/** 19990 → "R$ 199,90" */
export function formatCents(cents: number, currency?: string): string;

/**
 * Percentual inteiro 0–100.
 * `Math.round((1 - current / original) * 100)`.
 * Sem os dois preços, ou `original <= 0`, ou `current > original` → `null`.
 */
export function discountPercent(originalCents: number, currentCents: number): number | null;

/** `original - current`, ou `null` se faltar algum. Nunca negativo. */
export function savingsCents(originalCents: number, currentCents: number): number | null;
```

O cliente **não** recalcula `discountPercent` / `savingsCents` quando o payload da API já os traz. Estas funções existem para o formulário do admin (prévia ao vivo antes de salvar) e para o seed.

---

## `contracts/common.ts`

```ts
export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ApiError = {
  statusCode: number;
  code: string;
  message: string; // pt-BR, exibível
};

export type OfferFeedMeta = {
  appliedSportFilter: AppliedSportFilter;
  /** `null` no default. Preenchido só com `includeTotal=true`. */
  totalHint: number | null;
};

export type OfferFeedResponse = Paginated<OfferListItem> & {
  meta: OfferFeedMeta;
};
```

Paginação é **cursor, nunca offset**. `limit` default 10, máx 50. `nextCursor: null` = fim.

---

## `contracts/auth.ts`

```ts
export type SportSummary = {
  id: string;
  slug: string;
  name: string;
  iconName: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type MeResponse = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  onboarded: boolean;
  hasPassword: boolean;
  providers: AuthProvider[];
  sports: SportSummary[];
};

export type EmailRegisterBody = { email: string; password: string; name: string };
export type EmailLoginBody = { email: string; password: string };
export type GoogleAuthBody = { idToken: string };
export type AppleAuthBody = { identityToken: string; authorizationCode?: string };
export type RefreshBody = { refreshToken: string };
export type PasswordForgotBody = { email: string };
export type PasswordResetBody = { token: string; password: string };
export type PasswordChangeBody = { currentPassword?: string; newPassword: string };
export type VerifyEmailBody = { token: string };
export type UpdateMeBody = { name?: string; avatarUrl?: string };
export type SetSportsBody = { sportIds: string[] };
export type AdminLoginBody = { email: string; password: string };
export type AdminLoginResponse = { accessToken: string; expiresIn: number };
```

Login social e e-mail devolvem `AuthTokens`. Login do admin devolve só `AdminLoginResponse` (TTL 2h, sem refresh).

---

## `contracts/catalog.ts`

```ts
export type Sport = SportSummary & {
  sortOrder: number;
  active: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  iconName: string | null;
  color: string | null;
  parentId: string | null;
  sortOrder: number;
  children: Category[];
};

export type Store = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  active: boolean;
};
```

`GET /sports` → `Sport[]` (só `active`, por `sortOrder`).
`GET /categories` → `Category[]` (árvore; só ativas).
`GET /stores` → `Store[]` (só ativas). O admin vê `affiliateTag` num tipo interno, não neste.

---

## `contracts/offer.ts`

Dinheiro **sempre** `*Cents: number` (inteiro). Datas ISO 8601 UTC.

### Imagem

O storage gera três variantes (`thumb` 160, `card` 640, `full` 1280) + `blurhash`. Conector que só tem URL externa copia a mesma URL nas três.

```ts
export type OfferImage = {
  id: string;
  urlThumb: string;
  urlCard: string;
  urlFull: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  alt: string | null;
  sortOrder: number;
};
```

No **feed**, cada item manda `images` já reduzido: no máximo 5, só os campos que o card usa (`url` = `urlCard`, `width`, `height`, `blurhash`, `alt`). No **detalhe**, as três URLs.

```ts
export type OfferImageCard = {
  url: string; // urlCard
  width: number | null;
  height: number | null;
  blurhash: string | null;
  alt: string | null;
};
```

### Item de lista (feed, busca, favoritos, relacionadas)

```ts
export type OfferListItem = {
  id: string;
  slug: string;
  title: string;
  priceCents: number | null;
  originalPriceCents: number | null;
  currency: string;
  discountPercent: number | null;
  savingsCents: number | null;
  couponCode: string | null;
  hasCoupon: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  endingSoon: boolean;
  featured: boolean;
  verified: boolean;
  isFavorite: boolean;
  viewCount: number;
  store: Pick<Store, 'id' | 'slug' | 'name' | 'logoUrl'>;
  category: Pick<Category, 'id' | 'slug' | 'name' | 'iconName'> | null;
  sports: SportSummary[];
  images: OfferImageCard[];
};
```

Campos calculados no servidor, o cliente **não** refaz:

| campo | regra |
|---|---|
| `discountPercent` | `format.discountPercent(original, current)` gravado na escrita |
| `savingsCents` | `originalPriceCents - priceCents` se ambos existem e original > current; senão `null` |
| `hasCoupon` | `couponCode != null` |
| `endingSoon` | `expiresAt` no futuro e a menos de 48h |
| `verified` | `verifiedAt != null` |
| `isFavorite` | `false` se anônimo |

### Detalhe

```ts
export type OfferDetail = Omit<OfferListItem, 'images'> & {
  description: string | null;
  destinationUrl: string;
  affiliateUrl: string | null;
  source: OfferSource;
  startsAt: string | null;
  clickCount: number;
  images: OfferImage[];
};
```

A URL que o mobile abre é `affiliateUrl ?? destinationUrl`. **A comissão depende disso.**

### Redeem e favoritos

```ts
export type RedeemBody = { action: RedeemAction };

export type RedeemListItem = {
  id: string;
  action: RedeemAction;
  createdAt: string;
  offer: OfferListItem;
};

export type FavoriteListResponse = Paginated<OfferListItem> & {
  total: number; // para o badge da tab
};
```

### Query do feed (`GET /offers`)

| parâmetro | tipo | default | nota |
|---|---|---|---|
| `limit` | int | 10 | máx 50 |
| `cursor` | string | — | opaco |
| `sort` | `OfferSort` | `recent` | |
| `sports` | slugs csv | preferências | `sports=all` = feed geral |
| `categoryId` | id | — | inclui filhas |
| `storeId` | id | — | |
| `search` | string | — | mín. 2 chars |
| `minDiscount` | int 0–100 | — | |
| `minPriceCents` / `maxPriceCents` | int | — | |
| `hasCoupon` | bool | — | |
| `includeTotal` | bool | false | preenche `meta.totalHint` |
| `excludeOfferId` | id | — | para o carrossel "relacionadas" |

```ts
export type NewCountResponse = { count: number; capped?: boolean };
```

`GET /offers/new-count?since=<iso>` usa os **mesmos filtros** do feed.

---

## `contracts/ingestion.ts`

```ts
export type NormalizedOffer = {
  source: OfferSource;
  externalId: string;
  title: string;
  description?: string;
  destinationUrl: string;
  affiliateUrl?: string;
  priceCents?: number;
  originalPriceCents?: number;
  currency: 'BRL';
  couponCode?: string;
  imageUrls: string[];
  storeSlug: string;
  externalCategoryId?: string;
  expiresAt?: string;
};

export type OfferConnector = {
  readonly source: OfferSource;
  isConfigured(): boolean;
  fetchOffers(cursor?: string): Promise<NormalizedOffer[]>;
};

export type IngestionRun = {
  id: string;
  source: OfferSource;
  status: IngestionStatus;
  startedAt: string;
  finishedAt: string | null;
  itemsSeen: number;
  itemsCreated: number;
  itemsUpdated: number;
  error: string | null;
};
```

Oferta de conector entra `pending_review`. Importação manual por link no admin entra `draft`.

---

## Códigos de erro estáveis

O cliente ramifica em `code`, não na `message`.

| code | HTTP | onde |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | login |
| `EMAIL_TAKEN` | 409 | register |
| `FORBIDDEN` | 403 | admin com role != admin |
| `INVALID_LIMIT` | 400 | feed |
| `INVALID_CURSOR` | 400 | feed |
| `CURSOR_SORT_MISMATCH` | 400 | feed |
| `INVALID_FILTER` | 400 | feed |
| `NOT_FOUND` | 404 | oferta/slug |
| `UNAUTHENTICATED` | 401 | rota autenticada |

`message` é sempre pt-BR e pode ir direto para toast.

---

## Build

`tsc` para `dist/`, `"type": "module"`, `types` e `main` apontando para lá.

Expo + yarn workspaces: o `metro.config.js` do mobile precisa de `watchFolders` + `nodeModulesPaths`. Se o Metro não resolver o `dist/`, expor os fontes via `exports` — **decidir pela doc versionada do Expo da SDK alvo**, não por tentativa e erro.

O Agente API cria o pacote. O Agente Mobile só configura o Metro para enxergá-lo.
