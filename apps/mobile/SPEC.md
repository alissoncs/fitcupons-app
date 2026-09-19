# apps/mobile — Especificação

App Expo (React Native + TypeScript). É o produto: o usuário entra, diz quais esportes pratica, e recebe um feed de ofertas daquilo.

Base de referência: `/Users/alissonsilva/projects/duopace/mobile`.

Contratos, enums, tokens, catálogo de esportes e `formatCents`: **`packages/shared/SPEC.md`**. O feed já traz `discountPercent`, `savingsCents`, `endingSoon`, `hasCoupon`, `verified`, `isFavorite` — **não recalcular**.

> ⚠️ **Antes de escrever qualquer linha de código:** ler os docs **versionados** do Expo da SDK alvo (`https://docs.expo.dev/versions/vXX.0.0/`), conforme a regra que já existe em `duopace/AGENTS.md`. A API do Expo muda entre SDKs e escrever de memória gera código que não compila.

---

## Agente Mobile

**Dono:** só `apps/mobile/**`.

**Não toca:** `apps/api/**`, `apps/admin/**`, `packages/shared/**` (só importa), Prisma, docker-compose.

**Dependência:** `@fitcupons/shared` compilando + Metro apontando para o workspace (doc versionada da SDK). Se o pacote ainda não existir, scaffold do Expo e telas contra os tipos da SPEC do shared, **sem inventar campo**.

**Tokens** em `expo-secure-store`, nunca `AsyncStorage`. `API_URL` default `http://localhost:3000` (no device físico, IP da máquina).

**Fora deste agente:** conectores, painel admin, seed, parser de mensagens. Fastlane **entra neste agente** (é do app).

---

## 1. Stack

| Área | Escolha |
|---|---|
| Runtime | Expo (SDK atual), TypeScript |
| Navegação | Expo Router (file-based) |
| Estado de servidor | `@tanstack/react-query` |
| Estado local | Zustand (só sessão e preferências) |
| Login Google | `@react-native-google-signin/google-signin` |
| Login Apple | `expo-apple-authentication` |
| Token | `expo-secure-store` (Keychain / Keystore) |
| Imagens | `expo-image` (cache e blurhash) |
| Cupom | `expo-clipboard` |
| Loja externa | `expo-web-browser` |
| Ícones | `@expo/vector-icons` → `MaterialCommunityIcons` |
| Haptics | `expo-haptics` |
| Build | EAS Build; `fastlane` como no duopace |

**Monorepo:** o `metro.config.js` precisa de `watchFolders` e `nodeModulesPaths` apontando para a raiz para enxergar `packages/shared`. É o ponto de atrito conhecido de Expo + yarn workspaces — configurar pela doc versionada, não por memória.

---

## 2. Navegação

```
app/
├── _layout.tsx                 provider raiz: query, tema, sessão
├── (auth)/
│   ├── sign-in.tsx             entrada — social + e-mail
│   ├── sign-up.tsx             cadastro por e-mail e senha
│   └── forgot-password.tsx
├── onboarding/
│   └── sports.tsx              seleção de esportes
└── (tabs)/
    ├── _layout.tsx             tab bar
    ├── index.tsx               Feed
    ├── search.tsx              Buscar
    ├── saved.tsx               Salvos (favoritos + histórico)
    └── profile.tsx             Perfil
└── offer/[slug].tsx            detalhe (modal/push sobre as tabs)
```

**Gate de navegação** no `_layout.tsx` raiz, decidido pelo `GET /auth/me`:

| Condição | Destino |
|---|---|
| sem token | `(auth)/sign-in` |
| token + `onboarded: false` | `onboarding/sports` |
| token + `onboarded: true` | `(tabs)` |

Enquanto o `/auth/me` não responde, splash. Nunca piscar a tela de login para um usuário já logado.

---

## 3. Autenticação — três caminhos

### 3.1 Tela `sign-in`

Ordem vertical, de cima para baixo:

1. Logo + uma linha de proposta ("As melhores ofertas do esporte, num lugar só").
2. **Continuar com Google** — botão branco, borda, logo oficial.
3. **Continuar com a Apple** — `AppleAuthenticationButton` nativo. **Renderizar só no iOS.**
4. Divisor "ou".
5. Campos `e-mail` e `senha` + botão primário **Entrar**.
6. Links: "Esqueci minha senha" e "Criar conta".

> **Regra de loja:** a Apple exige Sign in with Apple sempre que o app oferece login social de terceiro (Google). Não é opcional — é reprovação garantida no review se faltar.

### 3.2 Google

`GoogleSignin.configure` com os client IDs de iOS, Android e Web. Pega o `idToken`, envia em `POST /auth/google`, guarda o par de tokens.

### 3.3 Apple

`AppleAuthentication.signInAsync` pedindo `FULL_NAME` e `EMAIL`. Envia `identityToken` **e `authorizationCode`** em `POST /auth/apple`.

⚠️ Dois detalhes que só aparecem em produção:
- A Apple só manda **nome e e-mail na primeiríssima autorização**. Se perder, não volta — a API tem que persistir na hora.
- O `authorizationCode` é o que permite revogar o grant na exclusão de conta (Guideline 5.1.1(v)). Sem ele, a exclusão fica incompleta e o review reprova.

Testar em **device físico**. O simulador não fecha o fluxo de forma confiável.

### 3.4 E-mail e senha

**`sign-up`** — `nome`, `e-mail`, `senha` (mínimo 8, com medidor de força e botão mostrar/ocultar), aceite dos termos. Chama `POST /auth/email/register`. Entra direto no app; a verificação de e-mail acontece em paralelo.

**`sign-in`** — `POST /auth/email/login`. Erro sempre genérico: **"E-mail ou senha incorretos."**

**`forgot-password`** — pede o e-mail, chama `POST /auth/password/forgot`, e mostra sempre a mesma confirmação ("Se houver uma conta com esse e-mail, enviamos o link."), exista o e-mail ou não. O e-mail abre `{API_URL}/auth/password/reset-link?token=` (HTML da API, funciona no Mailpit). O app também registra `fitcupons://auth/reset` e `fitcupons://auth/verify`.

Aceite de termos no `sign-up` é checkbox obrigatório **só no cliente**. Não há campo no User.

**Banner de verificação** — enquanto `emailVerified: false`, uma faixa discreta no topo do Feed: "Confirme seu e-mail" + "Reenviar". Não bloqueia o uso do app.

### 3.5 Sessão

Access token (30 min) e refresh token (60 dias) em `expo-secure-store`, **nunca** em `AsyncStorage`.

Um interceptor no cliente HTTP trata `401`: chama `POST /auth/refresh`, repete a request original, e **enfileira as requests concorrentes para que só um refresh dispare** — sem isso, abrir o app offline-para-online gera uma rajada de refreshes e a detecção de reuso do servidor derruba a sessão. Se o refresh falhar, limpa o storage e volta para `sign-in`.

---

## 4. Onboarding de esportes

Tela cheia, sem tab bar, logo após o primeiro login.

- Título: **"O que você pratica?"** · subtítulo: "Escolha ao menos um. Dá pra mudar depois."
- `GET /sports` → grid de **2 colunas** de cards selecionáveis.
- Cada card: **ícone `MaterialCommunityIcons` grande (32px) no topo** vindo de `sport.iconName`, nome embaixo.
- Não selecionado: fundo `surface`, borda `border`, ícone `inkMuted`.
  Selecionado: fundo `primarySoft`, borda `primary`, ícone e texto `primary`, e um check pequeno no canto.
- Toque dá `Haptics.selectionAsync()`.
- Botão fixo no rodapé: **"Continuar (N)"**, desabilitado com zero seleções.
- Submete `PUT /me/sports` → a API carimba `onboardedAt` → navega para o Feed.

**Fallback de ícone obrigatório:** `iconName` inválido (o admin pode digitar errado) não pode quebrar a tela. Renderizar `tag-outline` e seguir.

---

## 5. Telas principais

### 5.1 Feed (`(tabs)/index`) — a tela mais importante do app

**Feed no modelo Instagram:** as promoções mais recentes ficam **no topo**, e o usuário **rola para baixo** para carregar as mais antigas. Lista vertical comum, ordenada por `publishedAt` **descendente**.

#### Paginação

- Primeira carga: **10 ofertas**. `GET /offers?limit=10`. Sem `sports` na query: a API usa as preferências. Chip "Tudo" manda `sports=all`.
- Filtro por esporte manda slugs em csv (`sports=cycling,running`), **não** `sports[]`. Combinar com `categoryId`.
- `onEndReached` (com `onEndReachedThreshold={0.5}`) busca a próxima página de 10 pelo `nextCursor` e **acrescenta no fim**. `useInfiniteQuery` com `fetchNextPage`. Trocar filtro ou `sort` **descarta o cursor**.
- Rodapé de carregamento: um esqueleto de card, nunca um spinner solto.
- Fim da lista: "Você viu tudo por aqui" discreto, para a rolagem não parecer travada.
- Pull-to-refresh no topo busca as mais novas e **substitui** a primeira página.

#### Pílula "novas promoções"

Ao voltar para a aba, `GET /offers/new-count?since=<publishedAt do topo>` com **os mesmos filtros** da lista. Se `count > 0`, pílula flutuante no alto — `primary`, com seta para cima: **"3 novas promoções"**. Toque rola ao topo e recarrega. É o gancho de retorno diário, e evita puxar o conteúdo debaixo do dedo de quem está lendo.

#### Cabeçalho fixo

Fora da lista (não rola junto):

1. Logo à esquerda; busca (navega para a tab Buscar) e sino à direita. O sino é **placeholder visual** (fase 2) — toque não faz nada além de um toast "em breve".
2. **Duas faixas de chips horizontais:**
   - **Esportes** — os do usuário + "Tudo" (`sports=all`).
   - **Categorias** — `GET /categories`, com ícone dentro do chip (`categoryId`).

   Os dois filtros **se combinam** (esporte E categoria). Chip ativo em `primary` com texto invertido. Trocar o filtro refaz a query sem desmontar a tela e leva o scroll de volta ao topo.
3. Com filtro ativo, uma linha discreta: "Ciclismo · Bicicletas" + contagem **só se** `includeTotal=true` vier `meta.totalHint` + "limpar". Sem `totalHint`, omitir o número.

#### `OfferCard` — o post do feed

Card de largura cheia, separado do seguinte por um fio em `border`. De cima para baixo:

1. **Cabeçalho da loja** — avatar circular de 32px com o logo, nome em `ink` 14px semibold, e abaixo em `inkMuted` 12px o tempo relativo ("há 2 h", "ontem", "12 de set"). À direita, o **coração** de favoritar.
2. **Carrossel de fotos** — quadrado (1:1) ou 4:5, largura cheia, **paginação horizontal com snap**. `expo-image` com blurhash. Pontinhos na base quando há mais de uma foto; com mais de 6, contador `3/8`. Uma foto só: sem pontinhos, sem gesto.
3. **Badge de desconto** sobreposta no canto superior direito da foto: `accent` sólido, texto branco, `−{discountPercent}%` (campo do payload). Se `endingSoon`, uma segunda tarja âmbar no canto oposto: "Acaba em 2 dias".
4. **Linha de preço** — `formatCents(priceCents)` grande (20px, bold, `ink`), original riscado ao lado em `inkMuted`, e "Economize {formatCents(savingsCents)}" em `accent` 12px quando `savingsCents` não é null.
5. **Título** em 2 linhas com ellipsis.
6. **Etiqueta de cupom**, quando existe: pílula tracejada em `primary` com o código.
7. **Rodapé** — chips dos esportes à esquerda; à direita, botão de compartilhar.

Toque em qualquer lugar do card (menos coração, compartilhar e o gesto do carrossel) abre o detalhe.

> O carrossel dentro do card é de propósito: é a diferença entre um feed que se folheia e uma lista de links. Mas o gesto horizontal do carrossel **não pode roubar a rolagem vertical** da lista — configurar os gesture handlers com essa prioridade e testar no device, não só no simulador.

#### Favoritar

Otimista: o coração enche na hora e `PUT /offers/:id/favorite` vai em segundo plano com `Haptics.impactAsync(Light)`. Falhou, desfaz e mostra um toast. Nunca deixar o usuário esperando request para ver o coração mudar.

#### Estados

- **Carregando:** 3 esqueletos de card, não spinner em tela cheia.
- **Vazio com filtro:** usar `meta.appliedSportFilter`. `explicit` → "Nenhuma promoção de Ciclismo em Bicicletas" + "limpar filtros". `preferences` → "Nada nos seus esportes — ver tudo?" (`sports=all`).
- **Vazio sem filtro:** ilustração + "Em breve as primeiras promoções" + botão para ajustar esportes.
- **Erro:** card do sistema com "Não consegui carregar" + "tentar de novo".


### 5.2 Detalhe da promoção (`offer/[slug]`)

Dispara `POST /offers/:id/redeem { action: "view" }` **uma vez por montagem**.

Tela de rolagem com header transparente que ganha fundo conforme desce.

#### Carrossel de fotos (topo)

Altura de 320px, largura cheia, **paginação horizontal** com snap. `expo-image` com blurhash e `contentFit: "cover"`.

- Pontinhos na base: ativo em `primary`, inativos em branco 40%. Com mais de 6 fotos, trocar por contador `3/8`.
- **Pinch-to-zoom e duplo toque** abrem a foto em tela cheia sobre fundo escuro, com gesto de fechar arrastando para baixo.
- Sobre o carrossel: seta de voltar à esquerda, e à direita **coração** e **compartilhar** — todos em cápsula escura translúcida para ficarem legíveis sobre qualquer foto.
- **Badge de desconto grande** no canto inferior esquerdo do carrossel: `accent` sólido, `−34%`, 18px.
- Uma foto só: sem pontinhos, sem paginação.

#### Bloco da loja

Logo circular 40px, nome da loja em `ink`, e abaixo em `inkMuted` a origem (`store.name` — não há campo "via" separado). À direita, o selo **✓ Verificado** em `accent` quando `verified` é true — é o que sustenta a curadoria diante da regra da Apple sobre apps que "não agregam valor".

#### Bloco de preço — o herói da tela

Em card `accentSoft`, com folga:

```
De {formatCents(originalPriceCents)}          [ −{discountPercent}% ]
{formatCents(priceCents)}
Você economiza {formatCents(savingsCents)}
```

Preço atual em 32px, peso bold, `ink`. Preço original riscado em 14px `inkMuted`. Economia em `accent`. Parcelamento e frete grátis **não entram no MVP** — não existem campos; não inventar chips.

#### Cupom

Quando há `couponCode`, um card com borda **tracejada** em `primary`, o código em fonte monoespaçada com espaçamento largo, e um ícone de copiar à direita. O card inteiro é tocável.

#### Conteúdo

Título completo (sem truncar), descrição, chips de esportes (com ícone) e a categoria. Depois, uma linha de meta: validade (`expiresAt`), publicado há quanto tempo (`publishedAt`), e `viewCount` ("N pessoas viram").

#### Barra de ação fixa no rodapé

Fundo `surface` com borda superior e respeito à safe area. Muda conforme a oferta:

| Oferta tem | Botão | Ao tocar |
|---|---|---|
| só `couponCode` | **Copiar cupom** | copia · haptic de sucesso · `redeem(copy_code)` · vira "Copiado ✓" por 2s · revela "Ver na loja" abaixo |
| só link | **Ver oferta** | `redeem(open_link)` · abre em `expo-web-browser` |
| os dois | **Copiar e ir à loja** | copia · `redeem(copy_code)` · 400ms mostrando "Cupom copiado" · `redeem(open_link)` · abre a loja |

A URL aberta é `affiliateUrl` quando existe, `destinationUrl` caso contrário. **A comissão depende disso** — conferir manualmente sempre que mexer nesta barra.

#### Relacionadas

No fim, carrossel horizontal "Mais de {sport.name}" com `GET /offers?sports={slug}&limit=10&excludeOfferId={id}`. Sem endpoint extra.

---

### 5.3 Buscar (`(tabs)/search`)

Campo com debounce de 300ms → `GET /offers?search=`. Layout **grade de 2 colunas**, não o feed: buscar é atividade de comparação.

Filtros em bottom sheet, todos query params já existentes: esporte (`sports`), categoria (`categoryId`), loja (`storeId`), `minPriceCents`/`maxPriceCents`, `minDiscount`, `hasCoupon=true`, `sort`. Chips de filtro ativo abaixo do campo, cada um removível. Buscas recentes guardadas localmente.

---

### 5.4 Salvos (`(tabs)/saved`)

Duas abas no topo. Label da tab: **Salvos** (não "Meus resgates" — resgate é evento, favorito é estado).

- **Favoritos** — `GET /me/favorites`, grade de 2 colunas, mais recente primeiro. Deslizar para o lado remove. Vazio: "Toque no coração para salvar uma promoção."
- **Histórico** — `GET /me/redeems`, agrupado por dia, mostrando a ação (viu / copiou o cupom / foi à loja). É o "onde estava aquela oferta de ontem".

O badge da tab usa `total` de `GET /me/favorites`, não a length da primeira página.


### 5.5 Perfil (`(tabs)/profile`)

Avatar, nome, e-mail, e os chips dos provedores vinculados (Google / Apple / Senha, vindos de `me.providers`).

- **Meus esportes** → reabre o seletor do onboarding em modo edição.
- **Definir senha** (quando `hasPassword: false`) ou **Alterar senha** — é como uma conta só-social ganha senha.
- Notificações (placeholder, fase 2 — a mesma no-op do sino), Termos, Privacidade, Sobre.
- **Sair.**
- **Excluir minha conta** — confirmação em dois passos com o texto explicando que é irreversível. Chama `DELETE /auth/me`.

> Excluir conta **de dentro do app** é requisito da App Store para qualquer app com cadastro. Não pode ser só um link para o site.

---

## 6. Identidade visual

Tokens de `@fitcupons/shared/theme`. Roxo dessaturado é a marca e a navegação; **verde é exclusivamente economia** — badge de desconto, preço final, confirmação de cupom copiado. Nunca usar verde para navegação nem roxo para preço; a consistência dessa regra é o que faz o desconto "saltar" no feed.

| token | light | dark |
|---|---|---|
| `bg` | `#FBFAFD` | `#141119` |
| `surface` | `#FFFFFF` | `#1D1926` |
| `border` | `#E7E4EF` | `#2E2839` |
| `ink` | `#17141F` | `#F2F0F7` |
| `inkMuted` | `#6E697D` | `#A29DB2` |
| `primary` | `#5F4B8B` | `#A38FD6` |
| `primarySoft` | `#EFEBF7` | `#2A2338` |
| `accent` | `#3E8E6B` | `#6DBF97` |
| `accentSoft` | `#E4F1EB` | `#1C3329` |

Tipografia: uma sans geométrica (Inter ou similar via `expo-font`). Raio de canto 12 em cards, 10 em botões. Dark mode desde o início, seguindo o sistema.

---

## 7. Build e publicação

### 7.1 Fastlane

Espelhar o setup de `duopace/mobile/fastlane`, que já está rodando em produção. É build e envio para as lojas pela linha de comando, sem depender do EAS nem de clicar no Xcode.

**Arquivos:**

```
apps/mobile/
├── Gemfile                     fastlane + cocoapods travados na mesma versão
├── fastlane/
│   ├── Fastfile                as lanes
│   ├── Appfile                 bundle id, team id, package name
│   ├── Matchfile               repo privado de certificados
│   ├── .env.example            versionado
│   ├── .env                    real, gitignored
│   └── .gitignore
├── secrets/                    gitignored: .p8, .keystore, service account
└── scripts/
    └── bump-app-version.mjs
```

> O `Gemfile` trava `cocoapods` junto do `fastlane` de propósito — é o que impede o Expo de instalar CocoaPods num Ruby diferente e o build quebrar só na sua máquina. Copiar essa decisão do duopace.

**Lanes iOS:**

| lane | o que faz |
|---|---|
| `ios certificates` | Cria/baixa certificados e perfis via `match`, num repo git privado |
| `ios build` | `expo prebuild` + archive do IPA App Store, sem subir |
| `ios beta` | O mesmo + upload para o TestFlight |
| `ios device` | Instala uma build Release num iPhone no cabo, sem passar pela loja |

**Lanes Android:**

| lane | o que faz |
|---|---|
| `android build` | `expo prebuild` + AAB assinado, sem subir |
| `android internal` | AAB + upload para o Internal Testing |
| `android beta` | AAB + upload para o canal Beta |
| `android apk` | APK assinado para sideload |
| `android upload` | Sobe um AAB já construído, sem rebuildar |
| `android promote` | Promove um versionCode de um canal para outro, sem rebuildar |
| `android tracks` | Mostra o que está no ar em cada canal |
| `android release` | Muda rollout / release notes de um versionCode já publicado |
| `android halt` | Para um rollout escalonado |
| `android sha1` | Imprime o SHA-1 da keystore — **necessário para configurar o Google Sign-In** |

> `android sha1` não é acessório: sem o SHA-1 da keystore de upload registrado no Google Cloud, o login Google falha **só na build de produção**, e o erro não diz o porquê. Rodar essa lane faz parte de configurar o login, não do deploy.

**Convenções a manter do duopace:**

- `before_all` carrega os `.env` do Expo na ordem do `@expo/env` (`.env.production.local` → `.env.local` → `.env.production` → `.env`), para o Fastlane e o Metro enxergarem as mesmas variáveis.
- Build number e versionCode são calculados como `max(app.json, maior da loja + 1)`, com override por env. Elimina a colisão de versão, que é o erro de upload mais comum.
- Segredos em `secrets/` (gitignored) e caminhos apontados por env: `APP_STORE_CONNECT_KEY_PATH`, `ANDROID_KEYSTORE_PATH`, `GOOGLE_PLAY_JSON_KEY_PATH`.
- `fastlane/.env.example` versionado e `fastlane/.env` no gitignore.

**Bundle id / package name:** `app.fitcupons` nas duas plataformas, coerente com `app.json` e com o `Appfile`.

### 7.2 Requisitos das lojas

| | |
|---|---|
| Categoria primária | **Shopping** (App Store e Google Play) — é a categoria que cobre explicitamente apps de cupom |
| Categoria secundária | `Sports` ou `Health & Fitness` (opcional, App Store) |
| Ícone | 1024×1024, **opaco**, sem canto arredondado desenhado, sem texto |
| Sign in with Apple | **Obrigatório**, porque há login Google |
| Exclusão de conta | **Obrigatória** dentro do app |
| Privacy manifest | Declarar coleta de e-mail, nome e identificador de dispositivo |
| ATT | Não necessário enquanto não houver rastreamento entre apps de terceiros |

⚠️ Em junho/2026 a Apple endureceu as regras contra apps que "não agregam valor" — agregador de cupom é o perfil visado. A defesa é produto, não texto: curadoria humana antes de publicar, `verifiedAt` visível como selo no card, e expiração automática de oferta vencida. Nada de lista crua de links de afiliado.

---

## 8. Regras transversais

- Tudo em **pt-BR**, `R$`, `dd/MM`. Sem camada de i18n.
- Todo estado de lista tem as quatro variantes: carregando (skeleton), vazio, erro (com "tentar de novo"), e conteúdo.
- Sem conexão: banner no topo; o React Query serve o cache.
- Área de toque mínima de 44×44.
- Todo ícone tem `accessibilityLabel`; o badge de desconto tem label falado ("34 por cento de desconto").
