# apps/admin — Especificação

Next.js 15 (App Router) + TypeScript + Tailwind. Painel interno de curadoria: cadastra e modera ofertas, gerencia lojas e esportes, e lê as métricas de clique.

Base de referência: `/Users/alissonsilva/projects/duopace/admin`.

Contratos, enums, tokens de cor e `formatCents`: **`packages/shared/SPEC.md`**. Preços no formulário e na API são `priceCents` / `originalPriceCents` — a máscara `R$` é só UI.

**Não é público.** Não tem cadastro, não tem "esqueci minha senha" em tela, não é indexável (`robots.txt` bloqueando tudo + header `X-Robots-Tag: noindex`).

---

## Agente Admin

**Dono:** só `apps/admin/**`.

**Não toca:** `apps/api/**`, `apps/mobile/**`, `packages/shared/**` (só importa), `docker-compose.yml`, Prisma.

**Dependência:** `@fitcupons/shared` compilando. Se o pacote ainda não existir, criar o shell do Next e as telas contra os tipos da SPEC do shared **sem inventar campo**; trocar o import para `@fitcupons/shared` assim que o Agente API publicar o pacote. Se um tipo faltar, parar e reportar.

**Não fala com o banco.** Todo dado passa por `API_URL` (default `http://localhost:3000`). Sem API no ar, as telas ainda compilam com dados mock **tipados** nos contratos.

**Fora deste agente:** ingestão/conectores, Fastlane, seed, schema.

---

## 1. Stack

| Área | Escolha |
|---|---|
| Framework | Next.js 15, App Router, Server Components por padrão |
| Estilo | Tailwind, tokens de `@fitcupons/shared` |
| Componentes | Radix UI primitives + componentes locais em `src/components/ui` |
| Formulários | `react-hook-form` + `zod` via `@hookform/resolvers` |
| Tabelas | `@tanstack/react-table` |
| Gráficos | `recharts` |
| Datas | `date-fns` + locale `pt-BR` |
| Toast | `sonner` |

O admin **não** fala com o banco. Todo acesso a dado passa pela API.

---

## 2. Autenticação — login e senha simples

Sem OAuth, sem NextAuth, sem provedor externo. Um formulário, dois campos.

### Fluxo

1. `/login` — Server Action recebe `{ email, password }`.
2. A Server Action chama `POST /admin/auth/login` na API.
3. A API valida argon2id e **rejeita `role != admin`**.
4. O access token retornado é gravado num **cookie httpOnly**:
   `name: fc_admin`, `httpOnly: true`, `secure` em produção, `sameSite: "lax"`, `path: "/"`, `maxAge` igual ao TTL do token (2h).
5. Redireciona para `/offers`.

> O token **nunca** toca `localStorage` nem chega ao JavaScript do cliente. Server Components e Server Actions leem o cookie e repassam no header `Authorization` ao chamar a API. É o que torna XSS no painel não-fatal.

### Proteção de rotas

`src/middleware.ts` protege tudo fora de `/login`: sem cookie → redirect para `/login?next=…`. Como o middleware não valida assinatura (não tem o segredo), a autorização real acontece na API a cada request — o middleware é só conveniência de UX.

Qualquer resposta `401` da API dispara limpeza do cookie e redirect para `/login`. Centralizar isso no cliente HTTP (`src/lib/api.ts`), não em cada tela.

### Logout

Server Action que apaga o cookie e redireciona. Sem chamada à API (o token expira sozinho em 2h).

### Admin inicial

Vem do seed da API (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Trocar a senha em `/settings`, que chama `POST /auth/password/change`.

---

## 3. Mapa de rotas

```
src/app/
├── login/page.tsx                    público
└── (dashboard)/                      protegido pelo middleware
    ├── layout.tsx                    sidebar + header + usuário logado
    ├── page.tsx                      → redirect /offers
    ├── offers/
    │   ├── page.tsx                  lista
    │   ├── new/page.tsx              criar
    │   └── [id]/page.tsx             editar
    ├── moderation/page.tsx           fila dos coletores
    ├── import/page.tsx               importar do Mercado Livre
    ├── stores/page.tsx
    ├── sports/page.tsx
    ├── categories/page.tsx
    ├── users/page.tsx
    ├── ingestion/page.tsx            histórico de IngestionRun
    ├── stats/page.tsx                dashboard
    └── settings/page.tsx             trocar senha
```

---

## 4. Telas

### 4.1 `/login`

Card centrado, logo no topo. Campos `email` e `password` (com botão mostrar/ocultar). Erro genérico único: **"E-mail ou senha incorretos."** — nunca distinguir e-mail inexistente de senha errada. Botão com estado de carregando e `disabled` durante o submit.

### 4.2 `/offers` — lista

Tabela server-side com paginação por cursor.

**Colunas:** miniatura (capa) · título · loja · preço atual + preço original riscado · badge de desconto · esportes (chips, máx 3 + "+N") · fonte · status (badge colorido) · cliques · validade · ações.

**Filtros** (na URL, para o link ser compartilhável): busca por texto, status, fonte, loja, esporte, "expirando em 7 dias".

**Ações em massa:** publicar, arquivar, marcar como destaque. O cliente itera os endpoints existentes (`POST .../publish`, `POST .../archive`, `PATCH { featured }`) — não há bulk no MVP.

Linha de oferta expirada aparece esmaecida.

### 4.3 `/offers/new` e `/offers/[id]` — formulário

Layout de duas colunas. Coluna principal:

| Campo | Tipo | Validação |
|---|---|---|
| `title` | texto | obrigatório, 3–180 |
| `slug` | texto | gerado do título, editável, único |
| `description` | textarea | opcional |
| `storeId` | select com busca | obrigatório |
| `categoryId` | select | opcional |
| `sportIds` | **multi-select com ícone**, mesmo catálogo do app | ao menos 1 |
| `originalPriceCents` | moeda (máscara `R$`) | opcional |
| `priceCents` | moeda | opcional |
| `discountType` | select | default `none` |
| `discountValue` | número | conforme o tipo |
| `couponCode` | texto, caixa alta automática | opcional |
| `destinationUrl` | url | obrigatório, `https://` |
| `affiliateUrl` | url | opcional |
| `startsAt` / `expiresAt` | datetime | `expiresAt > startsAt` |
| `featured` | switch | |

**Comportamento do desconto:** preenchendo `originalPriceCents` e `priceCents`, o percentual é `discountPercent()` de `@fitcupons/shared` e aparece ao vivo ("−34%"). Se `priceCents > originalPriceCents`, alerta inline — é o erro de digitação mais comum e o que mais irrita o usuário no app. Não reimplementar a conta.

**Prévia ao vivo:** a coluna lateral renderiza o **card do feed exatamente como sai no mobile**, a partir de um `OfferListItem` montado no cliente com `formatCents` / `discountPercent` / `savingsCents` do shared. Cabeçalho da loja, foto de capa (`urlCard`), badge de desconto, título em 2 linhas, linha de preço com economia, etiqueta de cupom. É o que evita publicar oferta com título cortado, foto errada ou desconto que não fecha.

**Imagens:** dropzone com múltiplos arquivos, upload direto para `POST /admin/offers/:id/images`, reordenação por arrastar (a primeira é a capa), remover individual. Numa oferta nova, as imagens só sobem depois do primeiro save — mostrar isso explicitamente em vez de falhar em silêncio.

**Barra de ações fixa no rodapé:** Salvar rascunho · Publicar · Duplicar · Arquivar. `Publicar` valida que há ao menos uma imagem, uma loja, um esporte e `destinationUrl`.

### 4.4 `/moderation` — fila dos coletores

Ofertas em `pending_review` vindas de Amazon / Mercado Livre / AliExpress. Grid de cards, não tabela — aqui a decisão é visual.

Cada card mostra a foto, o dado normalizado, a fonte e um link para a URL original. Três ações: **Aprovar** (publica e carimba `verifiedAt` + `verifiedById`), **Editar e aprovar** (abre o formulário), **Rejeitar** (arquiva). Atalhos `A` / `E` / `R` — a fila pode ter centenas de itens e o mouse vira gargalo.

### 4.5 `/import` — importar do Mercado Livre

A tela que transforma o ML em fonte de catálogo. **Duas vias, porque a API do ML não é confiável sozinha** (ver `apps/api/SPEC.md` §8.1 — os endpoints antes públicos retornam 403 hoje).

**Aba "Buscar"** — campo de busca + seletor de categoria alimentado pela `MlCategoryMap`. Resultados em grade de cards com foto, título, preço, preço original, desconto calculado e nº de vendas. Cada card tem um checkbox; barra fixa no rodapé com "Importar N selecionados".

Ao importar: cria `Offer` em **`draft`** (não `published`), já com as fotos, o preço, a `affiliateUrl` montada, e `Category`/`Sport` sugeridos pela `MlCategoryMap`. Redireciona para a lista filtrada por esses rascunhos, para revisar antes de publicar.

Item já importado aparece marcado como **"já existe"** e desabilitado — a checagem é por `[source, externalId]`, a mesma chave de idempotência do cron.

**Aba "Por link"** — cola-se a URL de um produto do ML. O admin chama `POST /admin/ml/resolve`, que tenta a API e cai para a leitura da página pública se vier 403. Mostra a prévia normalizada e um botão "Criar rascunho". É o caminho que **sempre funciona**, mesmo sem credencial do ML, e por isso é o que deve estar pronto primeiro.

Quando a API está indisponível, a aba "Buscar" mostra um aviso claro ("Busca indisponível — use a importação por link") em vez de uma lista vazia sem explicação.

**Aba "Categorias"** — a `MlCategoryMap`. Lista as categorias do ML descobertas pelo comando `ml:sync-categories`, cada linha com: nome da categoria no ML, switch `enabled`, e dois selects para mapear à nossa `Category` e ao `Sport`. Só as `enabled` entram no cron.

### 4.6 `/stores`, `/sports`, `/categories`

CRUD em tabela com edição inline.

Em `/sports`: `name`, `slug`, `iconName` (com **prévia do ícone renderizado** ao lado do campo — digitar um nome inválido de `MaterialCommunityIcons` tem que ser visível na hora), `sortOrder` por arrastar, e switch de `active`.

Em `/categories`: os mesmos campos mais `color` (seletor) e `parentId`, com a lista em **árvore** e reordenação por arrastar dentro do nível. Cada linha mostra quantas ofertas publicadas usam aquela categoria — é o que informa se vale manter ou fundir.

### 4.7 `/users`

Lista com e-mail, nome, provedores de login (chips: Google / Apple / Senha), data de cadastro, último login, nº de resgates. Ações: promover a admin, rebaixar, banir (soft delete). **Um admin não pode rebaixar nem banir a si mesmo** — bloquear na UI e na API.

### 4.8 `/ingestion`

Histórico de `IngestionRun`: fonte, início, duração, vistos / criados / atualizados, status, erro. Botão "Rodar agora" por conector, que chama `POST /admin/ingestion/run`. Conector não configurado aparece como **"não configurado"**, e não como erro — é o estado normal de Amazon e AliExpress hoje.

### 4.9 `/stats`

Seletor de período (7d / 30d / 90d / custom) no topo. Cartões: total de cliques, cliques únicos, ofertas publicadas, usuários novos. Depois: série diária de `Redeem` por `action`, top 20 ofertas por clique, cliques por loja, cliques por esporte, e taxa `view → open_link` (é o número que diz se o card está convencendo).

### 4.10 `/settings`

Trocar a própria senha: senha atual, nova, confirmação.

---

## 5. Identidade visual

Tokens de `@fitcupons/shared/theme`. Roxo é marca e navegação; **verde é reservado para economia e sucesso** — badge de desconto, preço final, confirmação. A separação é semântica, não decorativa, e vale a pena manter no admin para a prévia do card bater com o app de verdade.

Sidebar em `surface` com o item ativo em `primarySoft` + texto `primary`. Dark mode desde o início, via `prefers-color-scheme` com override manual.

Badges de status: `draft` cinza · `pending_review` âmbar · `published` verde · `expired` cinza esmaecido · `archived` contorno.

---

## 6. Regras transversais

- Tudo em **pt-BR**, moeda `R$`, datas `dd/MM/yyyy HH:mm`. Sem camada de i18n.
- Toda ação destrutiva pede confirmação nomeando o alvo ("Arquivar «Tênis Nike Pegasus 41»?").
- Todo formulário mostra erro de campo vindo da API (`ApiError.message`), não só um toast genérico. Ramificar em `code` quando existir.
- Estados vazios com ação ("Nenhuma oferta ainda — criar a primeira").
- `loading.tsx` e `error.tsx` em cada rota do grupo `(dashboard)`.
- Em desenvolvimento, `seed-demo` popula ofertas, favoritos e cliques (`apps/api/SPEC.md` §8.2). Nenhuma tela do admin deve ser avaliada com o banco vazio — nem o dashboard, nem a fila de moderação.
- Oferta com `expiresAt` no passado aparece **esmaecida** na lista mesmo se o cron ainda não tiver mudado `status` para `expired`.

### Endpoints por tela

| tela | API |
|---|---|
| `/login` | `POST /admin/auth/login` |
| `/offers` | `GET /admin/offers` |
| `/offers/new` `[id]` | `POST/PATCH /admin/offers`, `POST .../publish`, `.../duplicate`, `.../archive`, imagens |
| `/moderation` | `GET /admin/moderation`, `POST .../publish` (aprova), `POST .../reject` |
| `/import` | `GET /admin/ml/search`, `POST /admin/ml/resolve`, `POST /admin/ml/import`, `GET/PATCH /admin/ml/categories` |
| `/stores` `/sports` `/categories` | CRUD `/admin/stores` `/sports` `/categories` |
| `/users` | `GET/PATCH /admin/users` |
| `/ingestion` | `GET /admin/ingestion-runs`, `POST /admin/ingestion/run` |
| `/stats` | `GET /admin/stats?from=&to=` |
| `/settings` | `POST /auth/password/change` (token admin) |
