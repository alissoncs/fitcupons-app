# apps/api — Especificação

NestJS 11 + Prisma 6 + PostgreSQL. Serve o mobile e o admin, roda os coletores de oferta em cron e contabiliza cliques.

Base de referência: `/Users/alissonsilva/projects/duopace/api`. Onde esta spec diz "portar", significa copiar o arquivo de lá e adaptar o modelo — não reescrever.

---

## 1. Stack e dependências

| Área | Pacote |
|---|---|
| Framework | `@nestjs/common` `@nestjs/core` `@nestjs/platform-express` ^11 |
| Config | `@nestjs/config` ^4 |
| ORM | `prisma` + `@prisma/client` ^6 |
| Auth | `@nestjs/jwt` `@nestjs/passport` `passport` `passport-jwt` |
| Senha | `argon2` (argon2id) |
| Apple | `jose` (assina o client secret `.p8`) |
| Google | `google-auth-library` |
| Rate limit | `@nestjs/throttler` ^6 |
| Cron | `@nestjs/schedule` ^6 |
| Validação | `class-validator` `class-transformer` |
| Log | `nestjs-pino` `pino` `pino-http` |
| Segurança | `helmet` |
| Storage | `@aws-sdk/client-s3` `sharp` |
| E-mail | `nodemailer` (SMTP) |
| Sanitização | `sanitize-html` (descrição de oferta vinda de coletor) |

**Não** incluir `@google/generative-ai` nem SDK de LLM: o parser de mensagens é determinístico por decisão de projeto.

---

## 2. Convenções

**IDs** — string com prefixo, padrão do duopace: `createId('usr')` → `usr_x7k2…`. Prefixos: `usr` `acc` `off` `img` `spt` `str` `cat` `rdm` `tok` `run` `msg`.

**Dinheiro** — sempre **inteiro em centavos** (`priceCents: 19990`). Nunca `float`, nunca `Decimal` serializado. Elimina erro de arredondamento e ambiguidade no JSON. A formatação (`R$ 199,90`) é responsabilidade do cliente.

**Datas** — `DateTime` no banco, ISO 8601 UTC no JSON.

**Paginação** — cursor, nunca offset. Request: `?cursor=<id>&limit=10` (**limit default 10**, máx 50). Response:
```json
{ "items": [...], "nextCursor": "off_abc123" }
```
`nextCursor: null` significa fim da lista.

**Erros** — formato único, sempre:
```json
{ "statusCode": 400, "code": "INVALID_CREDENTIALS", "message": "E-mail ou senha incorretos." }
```
`code` é estável e o cliente pode ramificar nele. `message` é pt-BR e exibível ao usuário. Filtro global `AllExceptionsFilter` em `src/common/`.

**Soft delete** — `deletedAt` em `User` e `Offer`. Toda query filtra `deletedAt: null`.

---

## 3. Variáveis de ambiente

```ini
# core
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3001

# db  (o sslrootcert só entra na URL em produção — ver comentário no schema)
DATABASE_URL=postgresql://fitcupons:fitcupons@localhost:5432/fitcupons
DIRECT_URL=postgresql://fitcupons:fitcupons@localhost:5432/fitcupons
DATABASE_CA_CERT=

# auth
APP_JWT_SECRET=
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_TTL_DAYS=60
GOOGLE_CLIENT_ID_IOS=
GOOGLE_CLIENT_ID_ANDROID=
GOOGLE_CLIENT_ID_WEB=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=

# admin seed
ADMIN_EMAIL=admin@fitcupons.app
ADMIN_PASSWORD=

# e-mail
SMTP_URL=
MAIL_FROM="fitcupons <nao-responda@fitcupons.app>"

# storage
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=

# ingestão
INGESTION_CRON=0 */6 * * *
ALIEXPRESS_APP_KEY=
ALIEXPRESS_APP_SECRET=
ALIEXPRESS_TRACKING_ID=
ML_CLIENT_ID=
ML_CLIENT_SECRET=
ML_REFRESH_TOKEN=
ML_AFFILIATE_TAG=ALISSON3208
ML_AFFILIATE_URL_TEMPLATE={permalink}?matt_word={tag}&matt_tool={tool}
ML_AFFILIATE_TOOL=

# seed
SEED_DEMO=true
SEED_IMAGE_STRATEGY=local
AMAZON_ENABLED=false
AMAZON_CLIENT_ID=
AMAZON_CLIENT_SECRET=
AMAZON_PARTNER_TAG=
```

`ConfigService.getOrThrow` para tudo que é obrigatório — falha no boot, não em runtime.

---

## 4. Schema Prisma

Arquivo: `prisma/schema.prisma`. Copiar o bloco `datasource` do duopace, inclusive o comentário sobre `sslrootcert` / `DIRECT_URL` — é conhecimento operacional real.

### Enums

```prisma
enum AuthProvider  { google apple email }
enum UserRole      { user admin }
enum OfferStatus   { draft pending_review published expired archived }
enum OfferSource   { manual amazon mercado_livre aliexpress telegram whatsapp }
enum DiscountType  { percentage fixed_amount free_shipping none }
enum RedeemAction  { view copy_code open_link }
enum TokenPurpose  { email_verification password_reset }
enum IngestionStatus { running success failed }
```

### `User`

| campo | tipo | nota |
|---|---|---|
| `id` | `String @id` | `createId('usr')` |
| `email` | `String @unique` | **sempre lowercase**, normalizado na escrita |
| `emailVerifiedAt` | `DateTime?` | |
| `passwordHash` | `String?` | argon2id. Null = conta só social |
| `name` | `String?` | |
| `avatarUrl` | `String?` | |
| `role` | `UserRole @default(user)` | |
| `onboardedAt` | `DateTime?` | null = ainda não escolheu esportes |
| `lastLoginAt` | `DateTime?` | |
| `deletedAt` | `DateTime?` | soft delete, LGPD |
| `createdAt` / `updatedAt` | | |

Relações: `accounts Account[]`, `sportPreferences UserSportPreference[]`, `redeems Redeem[]`, `refreshTokens RefreshToken[]`, `authTokens AuthToken[]`.

### `Account` — identidades de login (portar do duopace)

`id`, `userId`, `provider AuthProvider`, `providerAccountId` (o `sub` do provedor; para `email` é o próprio e-mail), `email?`, `name?`, `refreshToken?` (**só Apple**, para o revoke da Guideline 5.1.1(v)), `createdAt`.
`@@unique([provider, providerAccountId])`, `@@index([userId])`.

> Um `User` pode ter várias `Account`. É isso que permite a mesma pessoa entrar com Google hoje e com senha amanhã e cair na mesma conta.

### `RefreshToken`

`id`, `userId`, `tokenHash` (SHA-256 do token opaco — **o token em claro nunca é persistido**), `expiresAt`, `revokedAt?`, `replacedById?`, `userAgent?`, `ip?`, `createdAt`.
`@@index([userId])`, `@@unique([tokenHash])`.

### `AuthToken` — verificação de e-mail e reset de senha

`id`, `userId`, `purpose TokenPurpose`, `tokenHash`, `expiresAt`, `usedAt?`, `createdAt`.
`@@unique([tokenHash])`, `@@index([userId, purpose])`.

### `Sport`

`id`, `slug @unique`, `name`, `iconName`, `sortOrder Int @default(0)`, `active Boolean @default(true)`, timestamps.
Tabela e não enum: o admin precisa adicionar modalidade sem deploy.

**Seed (`prisma/seed.ts`)** — `iconName` são nomes de `MaterialCommunityIcons`:

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

### `UserSportPreference`

`userId`, `sportId`, `createdAt`. `@@id([userId, sportId])`.

### `Store`

`id`, `slug @unique`, `name`, `logoUrl?`, `websiteUrl?`, `affiliateTag?`, `active`, timestamps.

### `Category`

`id`, `slug @unique`, `name`, `iconName?`, `color?`, `parentId?` (auto-relação, permite subcategoria), `sortOrder Int @default(0)`, `active Boolean @default(true)`, timestamps.
`@@index([parentId])`.

Categoria é **o que a coisa é** (Tênis, Suplemento, Bicicleta); `Sport` é **para quem serve** (Corrida, Ciclismo). Um tênis de corrida é `category: running-shoes` + `sport: running`; uma barra de proteína é `category: supplements` e serve a vários esportes. São eixos independentes e o usuário filtra pelos dois.

**Seed de categorias** (nível 1; `iconName` de `MaterialCommunityIcons`):

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

### `Offer`

| campo | tipo | nota |
|---|---|---|
| `id` | `String @id` | `createId('off')` |
| `title` | `String` | |
| `slug` | `String @unique` | derivado do título + sufixo curto |
| `description` | `String?` | sanitizado quando vem de coletor |
| `storeId` | `String` | |
| `categoryId` | `String?` | |
| `priceCents` | `Int?` | preço atual |
| `originalPriceCents` | `Int?` | preço antes do desconto |
| `currency` | `String @default("BRL")` | |
| `discountType` | `DiscountType @default(none)` | |
| `discountValue` | `Int?` | percentual (0–100) ou centavos, conforme o tipo |
| `discountPercent` | `Int?` | **calculado na escrita** quando há os dois preços. É por onde o feed ordena |
| `couponCode` | `String?` | |
| `destinationUrl` | `String` | URL crua da loja |
| `affiliateUrl` | `String?` | com tag; o mobile abre esta quando existe |
| `source` | `OfferSource` | |
| `externalId` | `String?` | ASIN / `MLB…` / productId |
| `status` | `OfferStatus @default(draft)` | |
| `featured` | `Boolean @default(false)` | |
| `verifiedAt` | `DateTime?` | carimbado na aprovação — é a defesa contra a regra de "não agrega valor" da Apple |
| `verifiedById` | `String?` | |
| `startsAt` / `expiresAt` | `DateTime?` | |
| `viewCount` / `clickCount` | `Int @default(0)` | contador denormalizado |
| `publishedAt` | `DateTime?` | |
| `createdAt` / `updatedAt` / `deletedAt` | | |

Índices — desenhados para a paginação por keyset do feed (§6.1), por isso todos terminam em `id`:

```prisma
@@unique([source, externalId])                       // idempotência do upsert (só quando externalId != null)
@@index([status, publishedAt(sort: Desc), id(sort: Desc)])       // feed, sort=recent
@@index([status, discountPercent(sort: Desc), id(sort: Desc)])   // feed, sort=discount
@@index([status, clickCount(sort: Desc), id(sort: Desc)])        // feed, sort=popular
@@index([status, featured, publishedAt(sort: Desc)])             // carrossel de destaques
@@index([storeId])
@@index([categoryId])
```

> O `id` no fim de cada índice não é decoração: sem ele o keyset de desempate não é coberto e o Postgres cai para sort em memória na segunda página.

### `OfferImage`

`id`, `offerId`, `url`, `width?`, `height?`, `alt?`, `sortOrder Int @default(0)`, `createdAt`. `@@index([offerId])`.
A primeira imagem (`sortOrder: 0`) é a capa do card.

### `OfferSport`

`offerId`, `sportId`. `@@id([offerId, sportId])`, `@@index([sportId])`.

### `Favorite`

`userId`, `offerId`, `createdAt`. `@@id([userId, offerId])`, `@@index([userId, createdAt])`, `@@index([offerId])`.

> Distinto de `Redeem`. `Redeem` é log de evento (append-only, conta cliques); `Favorite` é **estado** (existe ou não existe). Misturar os dois faz a contagem de cliques mentir e o coração piscar sozinho.

### `MlCategoryMap` — o que importar do Mercado Livre

`id`, `mlCategoryId` (`MLB…`) `@unique`, `mlCategoryName`, `categoryId?` (nossa `Category`), `sportId?` (nosso `Sport`), `enabled Boolean @default(false)`, `lastCrawledAt?`, timestamps.

Tabela, não constante no código: quais categorias do ML fazem sentido para fitness é uma decisão de curadoria que muda, e o admin precisa ajustar sem deploy. É também o que traduz a taxonomia deles para a nossa na importação.

### `Redeem`

| campo | tipo | nota |
|---|---|---|
| `id` | `String @id` | `createId('rdm')` |
| `userId` | `String?` | nullable — permite contar anônimo depois |
| `offerId` | `String` | |
| `action` | `RedeemAction` | `view` \| `copy_code` \| `open_link` |
| `deviceId` / `ip` / `userAgent` | `String?` | |
| `createdAt` | `DateTime @default(now())` | |

`@@index([offerId, createdAt])`, `@@index([userId, createdAt])`, `@@index([action, createdAt])`.

> Sem `@@unique`: a tabela é um **log append-only de eventos**, não estado. Contar o mesmo usuário abrindo a mesma oferta cinco vezes é informação, não duplicata.

### `IngestionRun`

`id`, `source OfferSource`, `status IngestionStatus`, `startedAt`, `finishedAt?`, `itemsSeen`, `itemsCreated`, `itemsUpdated`, `error?`. `@@index([source, startedAt])`.

### `RawMessage` — criar agora, usar na fase 2

`id`, `channel` (`telegram` | `whatsapp`), `externalId`, `chatName?`, `body`, `receivedAt`, `parsedAt?`, `offerId?`. `@@unique([channel, externalId])`.
Desacopla coleta de parsing: o worker só escreve aqui e nunca toca em `Offer`.

---

## 5. Módulo `src/auth`

Três formas de entrar, uma única representação interna. Portar `auth.service.ts`, `apple-token.service.ts`, `strategies/jwt.strategy.ts`, `guards/jwt-auth.guard.ts`, `decorators/current-user.decorator.ts` e `avatar.util.ts` do duopace.

### 5.1 Estratégia de token

| | |
|---|---|
| **Access token** | JWT HS256, `APP_JWT_SECRET`, **30 min**. Payload `{ sub, role }`. Vai no header `Authorization: Bearer` |
| **Refresh token** | 32 bytes aleatórios em base64url, **60 dias**, guardado só como SHA-256. Rotaciona a cada uso: o antigo é revogado e aponta `replacedById` para o novo |

Detecção de reuso: se chegar um refresh token já revogado, **revogar toda a cadeia daquele usuário** e exigir novo login. É o sinal clássico de token roubado.

> **Por que difere do duopace** (que usa um JWT único de 7 dias): lá só existe login social, onde o provedor é a autoridade. Com senha no jogo, um bearer de 7 dias vazado é sequestro de conta por uma semana sem meio de corte. O par access+refresh dá revogação real — e é o que torna "sair de todos os dispositivos" possível.

`jwt.strategy.ts` resolve o `User` vivo a cada request e rejeita `deletedAt != null` — portar exatamente como está, inclusive o comentário sobre nunca ler `payload.sub` no controller.

### 5.2 Login social

`POST /auth/google` e `POST /auth/apple` — portar do duopace sem alterar a lógica.

- **Google**: valida o `idToken` com `google-auth-library` contra os três client IDs (iOS, Android, Web).
- **Apple**: valida o identity token contra o JWKS público da Apple. Se vier `authorizationCode`, troca por refresh token via `AppleTokenService` e guarda em `Account.refreshToken` — **é o que viabiliza o revoke na exclusão de conta**. Sem o `.p8` configurado o serviço degrada em silêncio e o login continua funcionando.

**Política de vínculo de conta** — é a decisão mais delicada desta spec:

1. Existe `Account` com aquele `[provider, sub]` → é esse usuário. Fim.
2. Não existe, mas o provedor afirma `email_verified` e já há `User` com esse e-mail → **vincula** a nova `Account` ao usuário existente.
3. E-mail não verificado pelo provedor, ou domínio `@privaterelay.appleid.com` → **cria usuário novo**. Nunca vincular por e-mail não verificado: é escalada de privilégio trivial.

### 5.3 E-mail e senha

Hash **argon2id** (`argon2`, parâmetros default da lib). Nunca bcrypt em código novo.

Política de senha: mínimo 8, máximo 128, não pode ser igual ao e-mail. Validação no DTO.

| Método | Rota | Body | Comportamento |
|---|---|---|---|
| POST | `/auth/email/register` | `{ email, password, name }` | Cria `User` + `Account(email)`. Dispara e-mail de verificação. Retorna o par de tokens — **a conta é usável antes de verificar**, com `emailVerified: false` no `/auth/me`. E-mail já existente → `409 EMAIL_TAKEN` |
| POST | `/auth/email/login` | `{ email, password }` | `401 INVALID_CREDENTIALS`. Mensagem idêntica para e-mail inexistente e senha errada, e **sempre executa um hash dummy** quando o usuário não existe, para não vazar existência pelo tempo de resposta |
| POST | `/auth/email/verify` | `{ token }` | Marca `emailVerifiedAt`, consome o `AuthToken` |
| POST | `/auth/email/resend-verification` | `{ email }` | Sempre `204` |
| POST | `/auth/password/forgot` | `{ email }` | Gera `AuthToken(password_reset)` válido por 1h, envia link. **Sempre `204`**, exista o e-mail ou não |
| POST | `/auth/password/reset` | `{ token, password }` | Troca a senha, consome o token e **revoga todos os refresh tokens** do usuário |
| POST | `/auth/password/change` | `{ currentPassword, newPassword }` | Autenticado. Se `passwordHash` for null (conta só social), define a senha sem exigir a atual — é o caminho de "adicionar senha à minha conta Google" |

Tokens de e-mail: 32 bytes aleatórios, guardados só como hash, uso único (`usedAt`), TTL de 24h (verificação) e 1h (reset).

### 5.4 Sessão

| Método | Rota | Nota |
|---|---|---|
| POST | `/auth/refresh` | `{ refreshToken }` → novo par. Rotação + detecção de reuso |
| POST | `/auth/logout` | Revoga o refresh token enviado |
| POST | `/auth/logout-all` | Autenticado. Revoga todos |
| GET | `/auth/me` | Ver payload abaixo |
| PATCH | `/auth/me` | `{ name?, avatarUrl? }` |
| DELETE | `/auth/me` | Soft delete + **revoke do grant Apple** via `AppleTokenService` + revoga todos os refresh tokens. Obrigatório para o review da App Store |

`GET /auth/me`:
```json
{
  "id": "usr_…", "email": "…", "name": "…", "avatarUrl": null,
  "role": "user",
  "emailVerified": true,
  "onboarded": true,
  "hasPassword": true,
  "providers": ["google", "email"],
  "sports": [{ "id": "spt_…", "slug": "cycling", "name": "Ciclismo", "iconName": "bike" }]
}
```
`onboarded`, `hasPassword` e `providers` existem para o mobile decidir o que mostrar sem uma segunda chamada.

### 5.5 Login do admin

`POST /admin/auth/login` — `{ email, password }`. Mesma verificação argon2, mas **rejeita `role != admin` com `403`** e emite um access token de TTL mais curto (`2h`), sem refresh token. O admin é web e renova por novo login; não vale a superfície de ataque de um refresh de 60 dias num painel administrativo.

Admin inicial vem do seed (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). O seed é idempotente: cria se não existir, e nunca sobrescreve a senha de um admin já existente.

---

## 6. Endpoints

Legenda: 🔓 público · 🔑 autenticado · 🛡️ admin · 〰️ auth opcional (o comportamento muda se houver usuário)

### Públicos / app

| | Método | Rota | Nota |
|---|---|---|---|
| 🔓 | GET | `/health` | `{ status, db }` |
| 🔓 | GET | `/sports` | Catálogo ativo, ordenado por `sortOrder`. Usado no onboarding |
| 🔓 | GET | `/stores` | Lojas ativas |
| 〰️ | GET | `/offers` | **O feed.** Especificado por inteiro em **§6.1** |
| 〰️ | GET | `/offers/new-count` | Alimenta a pílula "N novas promoções". Ver §6.1 |
| 🔓 | GET | `/offers/:slug` | Detalhe com `images[]`, `sports[]`, `store` |
| 〰️ | POST | `/offers/:id/redeem` | `{ action }` |
| 🔑 | PUT | `/me/sports` | `{ sportIds: string[] }` |
| 🔑 | GET | `/me/redeems` | Histórico do usuário, paginado |
| 🔓 | GET | `/categories` | Árvore de categorias ativas |
| 🔑 | GET | `/me/favorites` | Ofertas favoritadas, paginado, mais recente primeiro |
| 🔑 | PUT | `/offers/:id/favorite` | Idempotente. `204` |
| 🔑 | DELETE | `/offers/:id/favorite` | Idempotente. `204` |

**`POST /offers/:id/redeem` em detalhe.** Insere `Redeem` **e** incrementa o contador denormalizado na mesma transação (`view` → `viewCount`, `copy_code`/`open_link` → `clickCount`). Autenticação opcional: sem token, grava `userId: null` e usa `deviceId` do header `X-Device-Id`. Throttle de 1 evento por `[user|device, offer, action]` a cada 30s, para duplo toque não inflar métrica. Retorna `204`.

### Admin

| | Método | Rota |
|---|---|---|
| 🔓 | POST | `/admin/auth/login` |
| 🛡️ | GET/POST/PATCH/DELETE | `/admin/offers` · `/admin/offers/:id` |
| 🛡️ | POST | `/admin/offers/:id/publish` · `/reject` · `/duplicate` |
| 🛡️ | POST | `/admin/offers/:id/images` (multipart, múltiplos) |
| 🛡️ | DELETE | `/admin/offers/:id/images/:imageId` |
| 🛡️ | PATCH | `/admin/offers/:id/images/order` |
| 🛡️ | GET/POST/PATCH/DELETE | `/admin/stores` · `/admin/sports` · `/admin/categories` |
| 🛡️ | GET | `/admin/moderation` (fila de `pending_review`) |
| 🛡️ | GET | `/admin/stats` |
| 🛡️ | GET | `/admin/ingestion-runs` |
| 🛡️ | POST | `/admin/ingestion/run` (dispara o coletor manualmente) |
| 🛡️ | GET | `/admin/ml/search` (busca no Mercado Livre, para importar) |
| 🛡️ | POST | `/admin/ml/resolve` (`{ url }` → prévia normalizada) |
| 🛡️ | POST | `/admin/ml/import` (`{ itemIds[] }` → cria rascunhos) |
| 🛡️ | GET/PATCH | `/admin/ml/categories` (a `MlCategoryMap`) |
| 🛡️ | GET/PATCH | `/admin/users` (listar, promover a admin, banir) |

`GET /admin/stats` retorna: ofertas por status, top 20 ofertas por clique no período, cliques por loja, cliques por esporte, série diária de `Redeem` por `action`, e usuários novos por dia. Aceita `?from=&to=`.

---

## 6.1 `GET /offers` — o endpoint do feed

É o endpoint mais chamado do sistema e o que define a sensação do app. Especificado aqui por inteiro.

### Contrato

```http
GET /offers?limit=10&sort=recent&sports=cycling,running&categoryId=cat_abc&cursor=eyJ…
Authorization: Bearer <access token>     (opcional)
X-Device-Id: <uuid>                      (opcional, para anônimo)
```

### Parâmetros

| parâmetro | tipo | default | nota |
|---|---|---|---|
| `limit` | int | **10** | máx 50. Fora da faixa → `400 INVALID_LIMIT` |
| `cursor` | string | — | opaco. Veio de um `nextCursor`. Inválido → `400 INVALID_CURSOR` |
| `sort` | `recent` \| `discount` \| `popular` | `recent` | |
| `sports` | lista de slugs, separada por vírgula | preferências do usuário | `sports=all` força o feed geral |
| `categoryId` | id | — | inclui as subcategorias |
| `storeId` | id | — | |
| `search` | string | — | mín. 2 chars |
| `minDiscount` | int 0–100 | — | |
| `minPriceCents` / `maxPriceCents` | int | — | |
| `hasCoupon` | bool | — | `true` = só ofertas com `couponCode` |

### Filtro base — sempre aplicado, não negociável

```
status      = 'published'
deletedAt   IS NULL
startsAt    IS NULL OR startsAt  <= now()
expiresAt   IS NULL OR expiresAt >  now()
```

Oferta vencida **nunca** sai no feed, mesmo que alguém peça explicitamente. É o que impede o app de virar uma lista de links mortos — exatamente o que a App Store classifica como "não agrega valor".

### Semântica dos filtros

- **`sports`** — OR entre si (ciclismo **ou** corrida), AND com os demais filtros.
- **`categoryId`** — inclui **descendentes**. Filtrar por "Calçados" traz "Tênis de corrida". Resolver a subárvore com uma CTE recursiva sobre `Category.parentId`, ou manter a lista de ids em cache de processo (a árvore muda raramente e é pequena).
- **`search`** — `ILIKE '%termo%'` em `Offer.title` e `Store.name`. Simples de propósito. Se virar gargalo, migrar para `tsvector` com índice GIN — **não otimizar antes de medir**.
- **Preferências do usuário:** com token, usuário `onboarded`, e **nenhum** `sports` na query, o filtro usa as preferências dele. É o default que faz o app parecer pessoal na primeira abertura. Sem token, sem onboarding, ou com `sports=all`, devolve o feed geral.

### Ordenação e cursor

O feed é **keyset (seek), nunca offset**. O motivo é específico deste app: promoções entram no topo o tempo todo, e com `OFFSET` cada item novo empurra a janela — o usuário rolando vê itens repetidos e perde outros. Com keyset, a página seguinte é ancorada num registro concreto e o que chega depois não interfere.

Cada `sort` tem seu par de ordenação, sempre terminando em `id` para dar ordem total (sem isso, dois registros com o mesmo `publishedAt` podem trocar de lugar entre páginas e gerar duplicata):

| `sort` | `ORDER BY` | keyset |
|---|---|---|
| `recent` | `publishedAt DESC, id DESC` | `(publishedAt, id) < (cursor.publishedAt, cursor.id)` |
| `discount` | `discountPercent DESC NULLS LAST, id DESC` | idem sobre `discountPercent` |
| `popular` | `clickCount DESC, id DESC` | idem sobre `clickCount` |

> `popular` usa o contador denormalizado `clickCount`, que é **acumulado desde sempre**. Uma janela de "mais clicadas nos últimos 7 dias" exigiria agregar `Redeem` por período, o que não cabe em keyset — precisaria de uma coluna `trendingScore` recalculada por cron. Fica para depois; não vale a complexidade agora.

**Formato do cursor.** Base64url de um JSON compacto, **opaco para o cliente**:

```json
{ "v": 1, "s": "recent", "k": "2026-09-18T14:32:07.412Z", "id": "off_x7k2" }
```

Regras: o `s` do cursor tem que bater com o `sort` da request — se o cliente trocar a ordenação sem limpar o cursor, responder `400 CURSOR_SORT_MISMATCH` em vez de devolver lixo. O `v` permite mudar o formato sem quebrar cliente antigo.

**Consulta:** pedir `limit + 1` registros. Se vierem `limit + 1`, há mais página: devolver os primeiros `limit` e montar o `nextCursor` a partir do último devolvido. Se vierem `limit` ou menos, `nextCursor: null`. Isso evita um `COUNT(*)` por página, que seria o custo dominante.

### Resposta

```json
{
  "items": [
    {
      "id": "off_x7k2",
      "slug": "tenis-nike-pegasus-41-a3f9",
      "title": "Tênis Nike Pegasus 41 Masculino",
      "priceCents": 39590,
      "originalPriceCents": 59990,
      "currency": "BRL",
      "discountPercent": 34,
      "savingsCents": 20400,
      "couponCode": "FIT20",
      "hasCoupon": true,
      "publishedAt": "2026-09-18T14:32:07.412Z",
      "expiresAt": "2026-09-30T23:59:59.000Z",
      "endingSoon": false,
      "featured": false,
      "verified": true,
      "isFavorite": true,
      "store": {
        "id": "str_ml", "slug": "mercado-livre",
        "name": "Mercado Livre", "logoUrl": "https://…"
      },
      "category": { "id": "cat_foot", "slug": "footwear", "name": "Calçados", "iconName": "shoe-sneaker" },
      "sports": [{ "id": "spt_run", "slug": "running", "name": "Corrida", "iconName": "run" }],
      "images": [
        { "url": "https://…/card.webp", "width": 640, "height": 640, "blurhash": "LKO2…", "alt": null }
      ]
    }
  ],
  "nextCursor": "eyJ2IjoxLCJzIjoicmVjZW50Iiw…",
  "meta": {
    "appliedSportFilter": "preferences",
    "totalHint": null
  }
}
```

Campos que o servidor calcula para o cliente não ter que recalcular (e divergir):

- **`savingsCents`** = `originalPriceCents - priceCents`. Vai pronto porque aparece no card **e** no detalhe; duas implementações de arredondamento acabam mostrando números diferentes na mesma tela.
- **`endingSoon`** = `expiresAt` a menos de 48h. Regra de negócio, não de apresentação.
- **`verified`** = `verifiedAt != null`.
- **`hasCoupon`** = `couponCode != null`.
- **`meta.appliedSportFilter`** = `preferences` \| `explicit` \| `none`. É o que permite ao estado vazio dizer a coisa certa: com `preferences`, "nada nos seus esportes — ver tudo?"; com `explicit`, "limpar filtros".

**`images`** vem **só com a variante `card`** no feed, no máximo 5 por oferta, ordenadas por `sortOrder`. As demais variantes só no detalhe. Mandar `full` no feed multiplica o payload sem ninguém ver a diferença num card de 640px.

**`isFavorite`** — resolvido em **uma query só** por página: depois de buscar os itens, um `SELECT offerId FROM Favorite WHERE userId = ? AND offerId IN (…)` e um `Set` em memória. Nunca N+1, nunca uma request por card. Sem token, o campo vem `false` em todos.

### Cabeçalhos e cache

| caso | `Cache-Control` |
|---|---|
| autenticado | `private, no-store` — a resposta carrega `isFavorite`, que é por usuário |
| anônimo | `public, max-age=60` |

### `GET /offers/new-count`

Alimenta a pílula **"3 novas promoções"** do topo do feed.

```http
GET /offers/new-count?since=2026-09-18T14:32:07.412Z
→ { "count": 3 }
```

Conta ofertas publicadas depois de `since`, sob **os mesmos filtros** que o feed do usuário (preferências de esporte inclusive) — senão a pílula promete três promoções e a lista mostra zero. Contagem limitada a 99 (`{ "count": 99, "capped": true }`); acima disso o número exato não muda nada para o usuário e custa um `COUNT` caro.

### Erros

| código | quando |
|---|---|
| `INVALID_LIMIT` | `limit` fora de 1–50 |
| `INVALID_CURSOR` | cursor malformado ou versão desconhecida |
| `CURSOR_SORT_MISMATCH` | `sort` da request diferente do gravado no cursor |
| `INVALID_FILTER` | `categoryId`/`storeId` inexistente, `sports` com slug desconhecido |

### Verificação manual

- Percorrer o feed inteiro do seed demo com `limit=10` e conferir que **nenhum id se repete** entre páginas e que a contagem final bate com o banco.
- Publicar uma oferta nova **no meio** da paginação e continuar rolando: nada some, nada duplica (é o que o offset quebraria).
- Usuário com só `cycling` nas preferências e sem `sports` na query recebe só ciclismo, e `meta.appliedSportFilter = "preferences"`.
- O mesmo usuário com `sports=all` recebe tudo, e `meta.appliedSportFilter = "none"`.
- Oferta com `expiresAt` no passado não aparece em nenhuma combinação de filtro.
- Trocar `sort` reusando o cursor antigo devolve `400`, e não uma lista embaralhada.
- `EXPLAIN ANALYZE` da consulta de segunda página deve usar **Index Scan**, não `Sort` — se aparecer `Sort`, falta o `id` no índice.

---


## 7. `src/offers`, `src/sports`, `src/storage`

**`StorageService`** (`src/storage`) — portar o padrão do duopace. Recebe o buffer do upload, valida tipo (`image/jpeg|png|webp`) e tamanho (máx 8 MB), gera três variantes com `sharp` em webp — `thumb` 160px, `card` 640px, `full` 1280px, todas com `withoutEnlargement` — envia ao S3 sob `offers/{offerId}/{imageId}-{variant}.webp` e devolve as URLs. Interface própria (`StorageProvider`) para o provedor ser trocável por env.

---

## 8. `src/ingestion`

Contrato único, três implementações:

```ts
export interface OfferConnector {
  readonly source: OfferSource;
  isConfigured(): boolean;                                  // false ⇒ o cron pula, sem erro
  fetchOffers(cursor?: string): Promise<NormalizedOffer[]>;
}
```

`NormalizedOffer` vive em `@fitcupons/shared`.

`IngestionService` roda cada conector configurado, abre um `IngestionRun`, faz `upsert` por `[source, externalId]`, e grava o resultado. **Oferta vinda de conector entra como `pending_review`** — curadoria humana antes de publicar.

Cron com `@nestjs/schedule` no intervalo de `INGESTION_CRON`, com lock em banco para execuções não se sobreporem.

| Conector | Estado | Nota |
|---|---|---|
| `aliexpress.connector.ts` | Implementar inteiro | `aliexpress.affiliate.product.query`, assinatura do Open Platform, teto de 5.000 req/dia com contador persistido |
| `mercado-livre.connector.ts` | Implementar inteiro | Ver §8.1 — precisa de OAuth e tem fallback |
| `amazon.connector.ts` | **Nasce desligado** | **Creators API, não PA-API** (aposentada em 15/05/2026). OAuth 2.0 com cache de token, parâmetros lowerCamelCase. `isConfigured()` lê `AMAZON_ENABLED`. Fica dormente até a conta qualificar (10 vendas/30 dias, contínuo) |

### 8.1 Mercado Livre — desenho detalhado

⚠️ **Os endpoints do ML deixaram de ser públicos.** Verificado nesta sessão: `GET /sites/MLB`, `/sites/MLB/categories`, `/sites/MLB/search` e `/items/:id` retornam todos **HTTP 403** `{"message":"At least one policy returned UNAUTHORIZED","blocked_by":"PolicyAgent"}` sem token. Há também relatos de o mesmo PolicyAgent bloquear endpoints de catálogo **mesmo com token válido e escopo correto**. Qualquer desenho que assuma "é só chamar a API pública" está errado hoje.

Por isso o conector tem **duas vias** e nunca depende só da primeira.

**Via 1 — API autenticada.** Criar uma aplicação em `developers.mercadolivre.com.br` (`ML_CLIENT_ID` / `ML_CLIENT_SECRET`). O fluxo é `authorization_code` **uma vez**, autorizando com a conta `ALISSON3208` e escopo `offline_access`; o `refresh_token` resultante fica em `ML_REFRESH_TOKEN` e o serviço troca por access token sob demanda, com cache em memória até expirar. Endpoints usados: `/sites/MLB/search?category=…` e `/items?ids=` (em lotes de 20).

**Via 2 — fallback por página pública.** Quando a Via 1 devolve 403, o `MercadoLivreResolver` busca a **página HTML do produto** e extrai `og:title`, `og:image`, `product:price:amount` e o bloco JSON-LD. É menos rico e mais frágil que a API, mas funciona sem credencial e cobre o caso "colei um link no admin". Ele nunca roda em cron — só sob ação humana no admin, um item por vez.

**Mapeamento.** `id` (`MLB…`) → `externalId` · `title` → `title` · `price`/`original_price` → `priceCents`/`originalPriceCents` (multiplicar por 100 e arredondar) · `pictures[]` → `OfferImage` (usar a URL em resolução máxima, trocando o sufixo `-I.jpg` por `-F.jpg`) · `permalink` → `destinationUrl` · `category_id` → consulta `MlCategoryMap` para achar nossa `Category` e `Sport`.

**Categorias de interesse.** A raiz de esportes no MLB é `MLB1276` ("Esportes e Fitness") — **confirmar assim que houver token**, não tratar como certo. As subcategorias **não devem ser hardcoded**: um comando `ml:sync-categories` percorre `/sites/MLB/categories/MLB1276` e popula a `MlCategoryMap` com `enabled: false`; o admin liga as que interessam e mapeia cada uma para `Category` + `Sport`. O cron só percorre as categorias `enabled`.

**Filtro de relevância** antes de virar rascunho, porque busca por categoria traz muita coisa ruim:
- `original_price` presente **e** desconto ≥ 15% (sem desconto não é oferta, é catálogo);
- `sold_quantity` acima de um mínimo configurável, ou `condition: "new"`;
- lista de termos de exclusão por categoria (evita "capinha de celular" entrando em ciclismo);
- descartar item sem foto.

**Link de afiliado.** `affiliateUrl` montada por `ML_AFFILIATE_URL_TEMPLATE` sobre o `permalink`, com `ML_AFFILIATE_TAG=ALISSON3208`.
Não há API oficial de afiliados; o formato dos parâmetros de tracking é **observado, não documentado**. Gerar um link real no Portal do Afiliado com essa conta, inspecionar os parâmetros e ajustar o template para bater exatamente. Um `matt_tool` errado significa comissão não atribuída — e falha em silêncio, que é o pior modo de falha possível.

**Fase 2** — `MessageParserService` traduz `RawMessage → Offer(pending_review)` por regex: URL, `R$ 123,45`, `-40%`, código em caixa alta de 4–12 chars, loja pelo domínio. Sem LLM.

---

## 8.2 Seeds

Dois arquivos, com papéis diferentes. `prisma/seed.ts` roda **em todo ambiente, inclusive produção**, e é idempotente. `prisma/seed-demo.ts` roda **só quando `SEED_DEMO=true`** e nunca em produção.

### `seed.ts` — dados de base

Sports (as 14 da §4), Categories (as 10 da §4), o usuário admin de `ADMIN_EMAIL`/`ADMIN_PASSWORD`, e as lojas reais: Amazon, Mercado Livre, AliExpress, Netshoes, Centauro, Decathlon, Growth Supplements, Centauro, Track&Field. `upsert` por `slug` — nunca sobrescreve a senha de um admin existente.

### `seed-demo.ts` — anúncios falsos para desenvolver e demonstrar

**Cerca de 40 ofertas** cobrindo todos os esportes e categorias, para que o feed, os filtros e o carrossel tenham o que mostrar desde o primeiro `yarn dev`. Sem isso, toda tela de lista é um estado vazio e ninguém consegue avaliar o design.

Cada oferta demo tem:
- título realista em pt-BR ("Tênis Nike Pegasus 41 Masculino", "Whey Protein Concentrado 900g Growth");
- **2 a 5 imagens** (para o carrossel ter o que paginar);
- `originalPriceCents` e `priceCents` coerentes, com descontos espalhados entre 10% e 70%;
- metade com `couponCode`, metade só com link — é o que exercita as duas variantes do botão de resgate;
- 1 a 3 esportes e 1 categoria;
- `publishedAt` **espalhado ao longo dos últimos 30 dias**, com mais densidade nos últimos 3 dias. Isso importa: o feed é cronológico em formato de conversa e precisa de separadores de dia ("Hoje", "Ontem", "12 de setembro") para ser avaliado de verdade;
- algumas com `expiresAt` próximo, para o selo "Acaba em 2 dias" aparecer;
- 3 ou 4 com `featured: true`;
- 5 em `pending_review`, para a fila de moderação do admin não nascer vazia.

**Imagens** — `SEED_IMAGE_STRATEGY` escolhe a fonte:

| valor | o que faz | quando usar |
|---|---|---|
| `local` (default) | Lê os arquivos de `prisma/seed-assets/`, sobe pelo `StorageService` real (sharp → webp → S3/MinIO) e grava as URLs resultantes | Padrão. É o único que **exercita o pipeline de upload inteiro** — resize, conversão, nomeação, bucket. Bug de upload aparece no seed, não em produção |
| `picsum` | URLs `https://picsum.photos/seed/{slug}/1280/720` | Setup zero, sem binário no repo. As fotos não têm relação com o produto — serve para desenvolver layout, não para screenshot |
| `unsplash` | Lista curada de IDs do Unsplash, fixa no código | Quando precisar de screenshot que pareça real |

Para `local`, commitar ~25 fotos de esporte livres de licença em `prisma/seed-assets/`, nomeadas por categoria (`footwear-01.jpg`, `bikes-03.jpg`…), em 1280px. O seeder sorteia de forma **determinística** (semeada pelo slug da oferta), para que rodar o seed duas vezes dê o mesmo resultado e a revisão visual seja comparável.

Também gerar: **8 usuários demo** com preferências de esporte variadas, **favoritos** espalhados e **~300 registros de `Redeem`** distribuídos nos últimos 30 dias — sem isso o dashboard de métricas do admin e a aba de favoritos nascem vazios e não dá para avaliar nenhum dos dois.

Comando: `yarn workspace @fitcupons/api prisma:seed:demo`. Deve ser **repetível**: apaga o que criou antes (marcando as linhas demo) e recria.

---

## 9. Segurança

- `helmet`, CORS restrito a `CORS_ORIGINS`.
- `ValidationPipe` global com `whitelist: true` e `forbidNonWhitelisted: true`.
- Throttle: login social 20/min · login por senha **10/min por IP+e-mail** · `/auth/password/forgot` **3/h por e-mail** · `/offers/:id/redeem` 60/min.
- `X-Device-Id` é dado do cliente e **não é confiável** — serve para deduplicar métrica, nunca para autorizar.
- Nunca logar token, senha, hash ou `Authorization`. Configurar o redact do `pino`.
- Descrição de oferta vinda de coletor passa por `sanitize-html` antes de persistir.

---

## 10. Verificação

**Sem suíte de testes automatizados por enquanto** — decisão de projeto, para manter o ritmo. A verificação é manual e está descrita em `docs/PLAN.md`. O que muda na prática:

- Os **fixtures JSON** dos conectores continuam existindo em `test/fixtures/`, mas como **dados de desenvolvimento**, não como caso de teste: servem para rodar o `IngestionService` sem rede e sem credencial, via `yarn ingest:dry-run --source=mercado_livre --fixture`.
- Os pontos que um teste protegeria continuam sendo os mesmos, e viram **checagem manual obrigatória** antes de considerar a parte pronta: a política de vínculo de conta (§5.2), a montagem da `affiliateUrl` (§8.1), e o incremento de contador no `redeem` (§6).
- Quando a suíte entrar, começar por esses três — são os que falham em silêncio.
