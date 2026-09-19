# fitcupons — Plano de implementação (MVP)

## Context

`/Users/alissonsilva/projects/fitcupons` está vazio. O objetivo é um app de cupons de desconto, promoções e achados **do nicho de esportes** (ciclismo, corrida, natação, beach tennis, vôlei…), com:

- **mobile** (Expo) — consumidor final: login, escolhe esportes de interesse, vê feed de ofertas, resgata;
- **admin** (Next.js) — curadoria: cadastra e modera ofertas, lojas, esportes;
- **api** (NestJS) — serve o mobile, roda os coletores de ofertas em cron, contabiliza cliques.

O sinal de negócio é a tabela `Redeem`: toda vez que o usuário **abre** ou **resgata** uma oferta, grava-se um registro. Isso vira contagem de cliques, ranking de ofertas e base de atribuição de afiliado.

**Por que não começar do zero de verdade:** `/Users/alissonsilva/projects/duopace` já resolveu, em produção, quase toda a fundação não-diferenciada deste app — login Google + Apple, Prisma/Postgres com SSL CA, upload S3 com `sharp`, JWT guard, throttler, Expo. O plano reaproveita esse código em vez de reescrevê-lo.

### Especificações detalhadas

Este documento é o plano. O detalhe de implementação de cada parte mora ao lado do código:

- `apps/api/SPEC.md` — schema completo, fluxos de auth, todos os endpoints, conectores
- `apps/admin/SPEC.md` — login por cookie, mapa de rotas, cada tela campo a campo
- `apps/mobile/SPEC.md` — navegação, os três logins, onboarding, feed, resgate, requisitos de loja
- `packages/shared/SPEC.md` — o que é compartilhado e por quê

### Decisões já tomadas (nas perguntas)

| Tema | Decisão |
|---|---|
| Arquitetura | NestJS API + Next.js admin + Expo mobile, monorepo |
| **Feed** | **Modelo Instagram**: mais recentes **no topo**, rola para baixo para carregar as antigas. Página de **10**, `publishedAt desc`, carrossel de fotos dentro do card |
| Testes | **Sem suíte automatizada por enquanto** — verificação manual |
| Build mobile | Fastlane espelhando `duopace/mobile/fastlane` |
| Filtros | Duas faixas de chips combináveis: **esporte** e **categoria** |
| Favoritos | `Favorite` como estado (distinto de `Redeem`, que é log de evento). Coração no card e aba "Salvos" |
| Dados de demo | `seed-demo.ts` com ~40 ofertas, imagens, favoritos e ~300 cliques |
| Login | Mobile: Google + Apple + e-mail/senha. Admin: e-mail/senha simples |
| Nicho | Esportes. Loja: categoria primária `Shopping` (Apple e Google Play) |
| Resgate | `code` e `affiliateUrl` ambos opcionais; o card se adapta |
| Parser de mensagens | **Sem LLM** — regex + heurística determinística |
| MVP | Base (schema + auth + feed) + ingestão manual + conectores Amazon / Mercado Livre / AliExpress |
| Infra | Igual ao duopace: Postgres gerenciado (`DATABASE_URL`/`DIRECT_URL` + CA), S3, `sharp`, docker-compose local |
| Mercado Livre | API pública + tag de afiliado anexada na URL por template. Tag: **`ALISSON3208`** |
| Credenciais de afiliado | Só a tag do ML. Amazon e AliExpress ainda não → conectores atrás de interface, com fixtures |
| WhatsApp | Na conta pessoal (decisão do usuário, ver "Riscos") — **fase 2** |
| i18n | UI pt-BR, moeda BRL, sem camada de i18n. Código/schema/API em inglês |
| Tema | Roxo + verde, dessaturado |

---

## Riscos e bloqueios conhecidos (verificados nesta sessão)

Estes são fatos apurados, não suposições. O plano já está desenhado em volta deles.

1. **Amazon — PA-API 5.0 foi aposentada em 15/05/2026.** O substituto é a [Creators API](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi) (OAuth 2.0 no lugar de AWS SigV4, parâmetros lowerCamelCase, credenciais novas). Exige conta Associates *final-accepted* **e 10 vendas qualificadas nos últimos 30 dias, de forma contínua**. Um app novo não tem como atender isso.
   → **O conector Amazon é construído mas nasce desligado** (`AMAZON_ENABLED=false`). Liga quando a conta qualificar.

2. **Mercado Livre — dois problemas, não um.**
   **(a) A API deixou de ser pública.** Verificado nesta sessão: `GET /sites/MLB`, `/sites/MLB/categories`, `/sites/MLB/search` e `/items/:id` retornam **HTTP 403** `PA_UNAUTHORIZED_RESULT_FROM_POLICIES` sem token — e há relatos do mesmo bloqueio **com token válido** em endpoints de catálogo. Exige criar aplicação em `developers.mercadolivre.com.br` e um `refresh_token` obtido uma vez com a conta `ALISSON3208` (escopo `offline_access`).
   **(b) Não existe API de afiliados.** O programa roda só pelo painel web; a tag entra por template de URL (`ML_AFFILIATE_URL_TEMPLATE`), com o formato dos parâmetros **observado, não documentado**.
   → Conector com **duas vias**: API autenticada para o cron, e leitura da página pública do produto (og: tags + JSON-LD) como fallback para a importação por link no admin. A via de fallback funciona sem credencial nenhuma, e por isso é a que deve ficar pronta primeiro. Detalhado em `apps/api/SPEC.md` §8.1.

3. **AliExpress — é o único conector 100% viável hoje.** Open Platform, App Key/Secret, aprovação em 1–2 dias, `aliexpress.affiliate.product.query`, 5.000 req/dia, retorna só produto promocionável.
   → **É o conector de referência**: implementar ele primeiro e por inteiro; os outros dois seguem o mesmo contrato.

4. **WhatsApp (fase 2).** Não há caminho oficial — a Business API não lê grupos. Baileys/whatsapp-web.js são engenharia reversa do WhatsApp Web, violam os ToS, e a detecção é automatizada. Você optou por usar a conta pessoal e eu implemento assim. Mitigação de raio de alcance: worker em **processo separado**, que só escreve em `RawMessage`; se a sessão cair, API, admin e mobile seguem intactos.

5. **App Review.** Em junho/2026 a Apple endureceu as regras contra apps que "não agregam valor" — agregador de cupom é exatamente o perfil visado. Contramedida no produto: `Offer.verifiedAt` + `verifiedBy`, badge de "verificado" no app, e expiração automática. Nada de lista crua de links.

---

## Estrutura do repositório

Yarn workspaces (yarn 1.22, já instalado). `apps/mobile` exige configuração de Metro para monorepo — **consultar os docs versionados do Expo antes de escrever o `metro.config.js`**, conforme `duopace/AGENTS.md`.

```
fitcupons/
├── package.json                # workspaces: apps/*, packages/*
├── docker-compose.yml          # postgres local (espelha duopace)
├── AGENTS.md / CLAUDE.md
├── packages/
│   └── shared/                 # @fitcupons/shared — tipos de contrato da API,
│                               # catálogo de esportes, tokens de cor
└── apps/
    ├── api/                    # NestJS
    ├── admin/                  # Next.js App Router
    └── mobile/                 # Expo
```

---

## 1. Schema Prisma (`apps/api/prisma/schema.prisma`)

Modelar a partir de `duopace/api/prisma/schema.prisma` — copiar o bloco `datasource` (o comentário sobre `sslrootcert`/`DIRECT_URL` é conhecimento operacional real) e o padrão de enums/índices.

```prisma
enum AuthProvider   { google apple email }
enum UserRole       { user admin }
enum OfferStatus    { draft pending_review published expired archived }
enum OfferSource    { manual amazon mercado_livre aliexpress telegram whatsapp }
enum DiscountType   { percentage fixed_amount free_shipping none }
enum RedeemAction   { view copy_code open_link }
```

**`User`** — `email @unique`, `emailVerifiedAt`, `passwordHash?` (argon2id; null = conta só social), `name`, `avatarUrl`, `role`, `onboardedAt`, `lastLoginAt`, `deletedAt`.

**`Account`** — identidades de login, portada do duopace: `userId`, `provider`, `providerAccountId`, `email?`, `refreshToken?` (só Apple, para o revoke). `@@unique([provider, providerAccountId])`. É o que permite a mesma pessoa entrar com Google hoje e com senha amanhã e cair na mesma conta.

**`RefreshToken`** e **`AuthToken`** (verificação de e-mail / reset de senha) — ver `apps/api/SPEC.md` §5.

**`Sport`** — `slug`, `name`, `iconName`, `sortOrder`, `active`. **Tabela, não enum**: o admin precisa adicionar modalidade sem deploy. Seed inicial em `prisma/seed.ts` (ícones do `@expo/vector-icons` / MaterialCommunityIcons):

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

**`UserSportPreference`** — `@@id([userId, sportId])`. É o que o onboarding grava.

**`Store`** — `slug`, `name`, `logoUrl`, `websiteUrl`, `affiliateTag`, `active`.

**`Offer`** — `title`, `slug`, `description`, `storeId`, `price`, `originalPrice`, `currency` (`@default("BRL")`), `discountType`, `discountValue`, `couponCode`, `destinationUrl`, `affiliateUrl`, `source`, `externalId`, `status`, `featured`, `verifiedAt`, `verifiedById`, `startsAt`, `expiresAt`, `viewCount`, `clickCount`, `publishedAt`, timestamps + `deletedAt`.
- `@@unique([source, externalId])` — chave de idempotência dos conectores (upsert sem duplicar).
- `@@index([status, publishedAt])`, `@@index([status, featured, publishedAt])`.

**`OfferImage`** — `offerId`, `url`, `width`, `height`, `alt`, `sortOrder`. Uma oferta tem **fotos** (plural), conforme pedido.

**`OfferSport`** — `@@id([offerId, sportId])`. É o que casa a oferta com as preferências do usuário.

**`Redeem`** — `userId?`, `offerId`, `action` (`view` | `copy_code` | `open_link`), `deviceId`, `ip`, `userAgent`, `createdAt`. Índices `[offerId, createdAt]` e `[userId, createdAt]`. `userId` é opcional para permitir contagem de anônimo depois.

**`IngestionRun`** — `source`, `startedAt`, `finishedAt`, `itemsSeen`, `itemsCreated`, `itemsUpdated`, `status`, `error`. Observabilidade do cron.

**`RawMessage`** (já criar, usar na fase 2) — `channel` (`telegram`|`whatsapp`), `externalId`, `chatName`, `body`, `parsedAt`, `offerId?`. Desacopla coleta de parsing.

---

## 2. `apps/api` — NestJS

Base: `nest new`, depois copiar deps de `duopace/api/package.json` (Nest 11, Prisma 6, passport-jwt, throttler, helmet, nestjs-pino, `@aws-sdk/client-s3`, `sharp`, `jose`, `google-auth-library`, `@nestjs/schedule`). **Não** copiar `@google/generative-ai` — sem LLM aqui.

### 2.1 `src/auth` — portar do duopace quase 1:1

Copiar de `duopace/api/src/auth/`, trocando só o modelo de usuário:

- `auth.controller.ts` — `POST /auth/google`, `POST /auth/apple`, `GET /auth/me`, `PATCH /auth/me`, `DELETE /auth/me`
- **Novo (não existe no duopace):** e-mail e senha — `/auth/email/register`, `/auth/email/login`, `/auth/email/verify`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/password/change`; e sessão com `POST /auth/refresh` e `/auth/logout`. Hash argon2id. Detalhado em `apps/api/SPEC.md` §5.3
- `auth.service.ts` — verificação dos identity tokens, upsert de usuário, emissão do JWT
- `apple-token.service.ts` — **copiar sem alterar a lógica.** Resolve o revoke do grant Apple na exclusão de conta (Guideline 5.1.1(v)), com client secret assinado via `.p8`. É a parte que mais custa tempo para redescobrir.
- `strategies/jwt.strategy.ts`, `guards/jwt-auth.guard.ts`, `decorators/current-user.decorator.ts`, `avatar.util.ts`

Manter o `@Throttle({ default: { limit: 20, ttl: 60000 } })` nos endpoints de login.

**Adição nova ao `GET /auth/me`**: devolver `onboarded: boolean` e `sports: Sport[]`, para o mobile decidir se mostra o onboarding.

### 2.2 `src/sports`

- `GET /sports` — catálogo público (usado no onboarding)
- `PUT /me/sports` (auth) — body `{ sportIds: string[] }`; substitui as preferências em transação e faz `onboardedAt = now()` se ainda nulo

### 2.3 `src/offers`

- `GET /offers` — feed. Query: `sports[]`, `storeId`, `search`, `cursor`, `limit`, `sort` (`recent` | `discount` | `popular`). **Default sem `sports`: usar as preferências do usuário autenticado**; sem usuário, feed geral. Só `status = published` e `expiresAt` no futuro.
- `GET /offers/:slug` — detalhe com `images` e `sports`
- `POST /offers/:id/redeem` (auth opcional) — body `{ action }`. Grava `Redeem` **e** incrementa o contador denormalizado (`viewCount` ou `clickCount`) na mesma transação. Throttle por usuário+oferta para não inflar com duplo toque.

### 2.4 `src/admin`

Guard de `role = admin` (espelhar `duopace/api/src/admin/`). CRUD de `Offer` (com upload múltiplo de imagem), `Store`, `Sport`, fila de moderação (`status = pending_review`), e um `GET /admin/stats` lendo `Redeem` agregado.

### 2.5 `src/storage`

`StorageService` sobre `@aws-sdk/client-s3` + `sharp`: recebe upload, gera variantes webp (thumb/card/full), devolve as URLs que viram `OfferImage`. Portar o padrão do duopace.

### 2.6 `src/ingestion` — o coletor

Contrato único, três implementações:

```ts
export interface OfferConnector {
  readonly source: OfferSource;
  isConfigured(): boolean;              // false ⇒ o cron pula, sem erro
  fetchOffers(cursor?: string): Promise<NormalizedOffer[]>;
}
```

`NormalizedOffer` mora em `@fitcupons/shared`. `IngestionService` roda cada conector configurado, normaliza, faz `upsert` por `[source, externalId]`, abre `IngestionRun` e grava o resultado. Oferta vinda de conector entra como `pending_review` — curadoria humana antes de publicar (é também a defesa contra a regra de "não agrega valor" da Apple).

- **`connectors/aliexpress.connector.ts`** — implementar por inteiro. `aliexpress.affiliate.product.query`, assinatura MD5/HMAC do Open Platform, respeitar o teto de 5.000 req/dia com contador persistido. `ALIEXPRESS_APP_KEY` / `ALIEXPRESS_APP_SECRET` / `ALIEXPRESS_TRACKING_ID`.
- **`connectors/mercado-livre.connector.ts`** — `GET /sites/MLB/search?category=...` + `GET /items?ids=` para os dados. `original_price` vs `price` dá o desconto; `pictures[]` vira `OfferImage`; `id` (`MLB…`) vira `externalId`.
  `affiliateUrl` montada por `ML_AFFILIATE_URL_TEMPLATE` sobre o `permalink`, com `ML_AFFILIATE_TAG=ALISSON3208`. Default do template: `{permalink}?matt_word={tag}&matt_tool={tool}`.
  ⚠️ **Validar antes de confiar:** gerar um link real no Portal do Afiliado do ML com essa conta, inspecionar quais parâmetros de tracking ele usa de fato, e ajustar o template para bater exatamente. Como não há API oficial, o formato dos parâmetros é observado, não documentado — um `matt_tool` errado significa comissão não atribuída, e falha em silêncio.
- **`connectors/amazon.connector.ts`** — **Creators API, não PA-API.** OAuth 2.0 com cache de token, parâmetros lowerCamelCase. `isConfigured()` retorna false por padrão (`AMAZON_ENABLED`). Fica dormente até a conta qualificar.

Cron com `@nestjs/schedule`, intervalo por env (`INGESTION_CRON`), com lock para não sobrepor execuções.

**Fase 2 (não é MVP):** `apps/collector` — processo separado com GramJS (Telegram, sessão MTProto de usuário) e Baileys (WhatsApp). Só escreve `RawMessage`. Um `MessageParserService` na API traduz `RawMessage → Offer(pending_review)` por regex: URL, `R$ 123,45`, `-40%`, código em caixa alta de 4–12 chars, nome da loja pelo domínio.

---

## 3. `apps/admin` — Next.js

Base: `duopace/admin` (Next 15 App Router, Tailwind). Telas:

1. **Offers** — lista com filtro por status/fonte/esporte; formulário com upload múltiplo de imagem, seletor multi de `Sport`, preço/preço original com cálculo automático do desconto, `couponCode`, `destinationUrl`.
2. **Moderação** — fila de `pending_review` vinda dos conectores; aprovar (publica e carimba `verifiedAt`/`verifiedById`) ou rejeitar.
3. **Stores** e **Sports** — CRUD, incluindo `iconName` e `sortOrder`.
4. **Dashboard** — agregados de `Redeem`: ofertas mais clicadas, cliques por loja, por esporte, série temporal.

Login do admin: **e-mail e senha simples**, sem OAuth. `POST /admin/auth/login` valida argon2id e rejeita `role != admin`; o token vai para um cookie **httpOnly** (nunca `localStorage`). Admin inicial vem do seed (`ADMIN_EMAIL`/`ADMIN_PASSWORD`). Detalhado em `apps/admin/SPEC.md` §2.

---

## 4. `apps/mobile` — Expo

> **Antes de escrever qualquer linha:** ler os docs versionados do Expo da SDK alvo, conforme `duopace/AGENTS.md`. O `metro.config.js` precisa da configuração de monorepo (`watchFolders` + `nodeModulesPaths`).

Portar a estrutura de `duopace/mobile/src`. Telas:

1. **Sign in** — três caminhos: Google (`@react-native-google-signin`), Apple (`expo-apple-authentication`, obrigatório no iOS porque há login social de terceiro) e **e-mail + senha**, mais `sign-up` e `forgot-password`. Tokens em `expo-secure-store`, nunca `AsyncStorage`. Detalhado em `apps/mobile/SPEC.md` §3.
2. **Onboarding de esportes** — mostrado quando `me.onboarded === false`. Grid de *chips* selecionáveis, **cada um com ícone** (`MaterialCommunityIcons` pelo `sport.iconName`) e o nome embaixo. Multi-seleção, mínimo 1, botão "Continuar" → `PUT /me/sports`.
3. **Feed** — lista de `OfferCard` (foto, loja, título, preço riscado + preço atual, badge verde de `-XX%`), filtro rápido por esporte no topo, pull-to-refresh, paginação por cursor. Ao renderizar o detalhe dispara `redeem(action: "view")`.
4. **Detalhe da oferta** — carrossel de fotos, descrição, validade, e a ação adaptativa:
   - tem `couponCode` → botão **"Copiar cupom"** (`expo-clipboard`) → `redeem(copy_code)`, depois oferece abrir a loja;
   - só `affiliateUrl` → botão **"Ver oferta"** → `redeem(open_link)` → `expo-web-browser`;
   - tem os dois → copia o código e abre a loja em sequência.
5. **Perfil** — dados da conta, editar esportes, e **excluir conta** (chama `DELETE /auth/me`, que dispara o revoke Apple — requisito de review).

### Identidade visual

Roxo como marca/navegação; verde reservado para **economia** (badge de desconto, preço final, confirmações) — a separação é semântica, não decorativa. Tons dessaturados, conforme pedido. Tokens em `packages/shared/theme.ts`:

| token | light | dark |
|---|---|---|
| `bg` | `#FBFAFD` | `#141119` |
| `surface` | `#FFFFFF` | `#1D1926` |
| `border` | `#E7E4EF` | `#2E2839` |
| `ink` | `#17141F` | `#F2F0F7` |
| `inkMuted` | `#6E697D` | `#A29DB2` |
| `primary` (roxo) | `#5F4B8B` | `#A38FD6` |
| `primarySoft` | `#EFEBF7` | `#2A2338` |
| `accent` (verde) | `#3E8E6B` | `#6DBF97` |
| `accentSoft` | `#E4F1EB` | `#1C3329` |

---

## 5. Prompt para gerar logo e ícone (outra IA)

Entregar ao usuário em `docs/brand-prompt.md`. Dois prompts, porque logo e ícone têm restrições diferentes.

### 5.1 Logo (horizontal, para admin e materiais)

> Design a modern, minimal wordmark logo for a mobile app called **"fitcupons"** — a curated discount and deals app for sports enthusiasts (cycling, running, swimming, beach tennis, volleyball).
>
> **Concept:** combine the idea of a *coupon/tag* with *motion*. The mark should read as a small, rounded price-tag or ticket shape with a subtle forward lean or a clipped corner suggesting speed — not a literal scissors, percentage sign, or shopping cart.
>
> **Style:** flat vector, geometric, clean, confident. Rounded corners (4–6px optical radius). No gradients, no bevels, no drop shadows, no 3D, no glossy highlights. Thick, even strokes that survive at 24px.
>
> **Color:** a muted, desaturated palette — deep violet `#5F4B8B` as the primary, muted green `#3E8E6B` as a single accent. Low chroma, calm and premium, not neon or candy-colored. Neutral ink `#17141F` for the wordmark.
>
> **Typography:** the wordmark "fitcupons" set in a geometric sans-serif, all lowercase, medium weight, slightly tight letter-spacing. The mark sits to the left of the wordmark.
>
> **Output:** horizontal lockup on a plain white background, generous margins, centered, SVG-friendly flat shapes. Also provide a monochrome single-color version.
>
> **Avoid:** stock-photo realism, mascots, people, gym equipment, dumbbells, literal coupons with dashed borders, generic "% OFF" starbursts, cluttered detail.

### 5.2 Ícone do app (1024×1024)

> Design a **1024×1024 px mobile app icon** for "fitcupons", a curated sports deals app.
>
> **Composition:** a single centered symbol on a solid background. The symbol is an abstract rounded price-tag / ticket silhouette with one clipped corner and a small circular punch-hole, tilted slightly forward to imply motion. Bold and simple enough to be instantly legible at 40×40 px.
>
> **Color:** solid background in deep muted violet `#5F4B8B`; the symbol in an off-white `#FBFAFD` with a single muted green `#3E8E6B` accent shape (a small angled slash or the punch-hole ring). Flat color only — no gradient, no gloss, no shadow, no outer glow.
>
> **Constraints:** fully opaque, edge-to-edge square, **no transparency** (iOS rejects alpha), **no rounded corners drawn in** (the OS applies the mask), no text, no letters, no wordmark, nothing within 60 px of the edges. High contrast between symbol and background.
>
> **Output:** flat vector style, 1024×1024 PNG, plus a dark-background variant using `#141119` with the symbol in `#A38FD6` and `#6DBF97`.
>
> **Avoid:** any text or lettering, photorealism, gradients, thin hairlines, busy detail, drop shadows, skeuomorphic paper/ticket textures.

---

## Ordem de execução

1. Scaffold do monorepo, `docker-compose.yml`, `packages/shared` (tipos, catálogo de esportes, tokens de cor).
2. `apps/api`: Prisma schema + migration + seed de `Sport` e `Store`.
3. `apps/api`: portar `src/auth` do duopace; `/sports`; `PUT /me/sports`.
4. `apps/api`: `offers` (feed, detalhe, redeem) + `storage`.
5. `apps/admin`: CRUD de Offer/Store/Sport + upload + dashboard.
6. `apps/mobile`: login → onboarding de esportes → feed → detalhe → resgate → perfil.
7. `apps/api/src/ingestion`: contrato + AliExpress completo, Mercado Livre, Amazon (desligado) + fila de moderação no admin.
8. `docs/brand-prompt.md`.

**Onde os seeds entram:** `prisma/seed.ts` (sports, categories, stores, admin) no passo 2, junto da migration. `prisma/seed-demo.ts` logo depois — **antes** do admin e do mobile, não depois. Construir tela de lista contra banco vazio é construir às cegas: a paginação do feed, o carrossel de fotos e o dashboard de métricas só podem ser avaliados com volume e datas espalhadas.

**Fastlane** entra no passo 6, junto do mobile, não no fim. Configurar assinatura depois que o app está pronto atrasa o primeiro TestFlight em dias — e a lane `android sha1` é pré-requisito do login Google em produção, não etapa de deploy.

---

## Verificação

**Infra local** (`docker-compose.yml` na raiz)
- `docker compose up -d` sobe postgres (**5436**), MinIO (**9100**, console **9101**) e Mailpit (SMTP **1026**, web **8026**). As portas estão deslocadas de propósito: duopace já usa 5435 e obrai usa 5432.
- O serviço `minio-init` cria o bucket `fitcupons` e o deixa com leitura pública — o mobile carrega as fotos direto pela URL.
- `docker compose --profile tools up -d` adiciona o pgAdmin em **5051**.
- Os apps rodam fora do container no dia a dia (`yarn dev`). O profile `apps` existe para subir tudo em container, mas depende dos Dockerfiles, que nascem com cada app.
- E-mail de verificação e reset de senha caem no Mailpit — abrir http://localhost:8026 para pegar o link.

**Banco e API**
- `cp apps/api/.env.example apps/api/.env` → `yarn workspace @fitcupons/api prisma:push && prisma:seed` → `prisma:studio` confirma os 14 esportes e as 10 categorias.
- `prisma:seed:demo` popula ~40 ofertas com fotos, favoritos e ~300 cliques.
- `yarn workspace @fitcupons/api dev`, depois: `GET /health`, `GET /sports` (14 itens), `GET /offers` sem auth (feed geral).

**Auth (o ponto mais arriscado do port)**
- Login Google real pelo mobile → `GET /auth/me` devolve `onboarded: false`.
- `PUT /me/sports` com 3 ids → `GET /auth/me` devolve `onboarded: true` e os 3 esportes.
- Login Apple **em device físico iOS** (o simulador não fecha o fluxo de forma confiável).
- `DELETE /auth/me` com credenciais Apple `.p8` configuradas → confirmar 200 e que o registro foi para `deletedAt`. Sem `.p8`, o `AppleTokenService` degrada em silêncio — verificar que não derruba a request.

**Feed e Redeem** (é o coração do produto)
- Criar 2 ofertas no admin: uma só com `couponCode`, outra só com `affiliateUrl`. Confirmar que o card no mobile muda de ação sozinho.
- Abrir o detalhe → `select count(*) from "Redeem" where action='view'` incrementa e `Offer.viewCount` bate.
- Copiar cupom / abrir link → `copy_code` / `open_link` gravados, `clickCount` bate.
- `GET /offers` autenticado como usuário que escolheu só `cycling` devolve apenas ofertas de ciclismo; sem auth devolve tudo.

**Ingestão**
- Rodar os conectores contra os fixtures JSON de `test/fixtures/` — sem rede, sem credencial: `yarn ingest:dry-run --source=mercado_livre --fixture`.
- `isConfigured() === false` (o caso real hoje, já que não há credenciais): o cron roda, pula todos, grava `IngestionRun` com `itemsSeen: 0` e **não lança**.
- Rodar o mesmo fixture duas vezes → `itemsCreated` na primeira, `itemsUpdated` na segunda, zero duplicata (valida o `@@unique([source, externalId])`).
- **Mercado Livre, ponta a ponta com dinheiro real:** o conector é o único que tem credencial hoje, então dá pra testar de verdade. Rodar contra a API pública, pegar a `affiliateUrl` gerada, abrir no navegador e conferir no painel de afiliado do ML se o clique foi atribuído a `ALISSON3208`. Enquanto isso não for confirmado, tratar o conector como não-validado.

**Feed**
- Abre com **10 ofertas**, a mais recente no topo.
- Rolar até o fim carrega mais 10 e **acrescenta embaixo**, sem duplicar item nem pular posição. Testar com 4 páginas seguidas.
- Chegar ao fim do seed mostra "Você viu tudo por aqui", e não uma rolagem que parece travada.
- Pull-to-refresh traz as mais novas sem duplicar o que já estava na tela.
- Publicar uma oferta no admin e voltar à aba mostra a pílula "1 nova promoção".
- **O gesto horizontal do carrossel dentro do card não pode roubar a rolagem vertical.** Testar em device físico, não no simulador — é onde isso sempre passa despercebido.

**Favoritos e categorias**
- Coração enche na hora (otimista) e sobrevive a fechar e reabrir o app.
- Falha de rede no favoritar desfaz o coração e avisa — não deixa estado mentiroso.
- Filtro por categoria pai traz as ofertas das filhas.
- Esporte + categoria combinados filtram pelos dois, não por um só.

**Visual**
- Carrossel de fotos do detalhe: paginação com snap, pontinhos corretos, zoom, e o caso de **uma foto só** sem pontinhos.
- Feed e detalhe em light e dark mode, em tela estreita, sem scroll horizontal.
- Ícones dos esportes renderizando no onboarding — `iconName` inválido não pode quebrar a tela (fallback).
