# Configuração e variáveis de ambiente

Inventário do que o fitcupons **lê hoje**, o que a API **ainda precisa implementar**, e o que você precisa **preencher com credenciais reais** antes de cada etapa.

Nada deste arquivo substitui os `.env.example`. Eles continuam a fonte operacional; este documento explica o porquê, de onde vem cada valor, e o que ainda está vazio.

**Regra:** `.env` é gitignored. Só versionar `.env.example`. Dinheiro no JSON é sempre inteiro em centavos — nenhuma env de preço em float.

---

## Status rápido

| Peça | Código lê env? | Você precisa preencher? |
|---|---|---|
| Docker local (Postgres, MinIO, Mailpit) | sim, no `docker-compose.yml` | não — defaults locais bastam |
| `apps/api` | **ainda não** (Nest/Prisma não estão no disco) | copiar `.env` agora; a API vai exigir o bloco obrigatório no boot |
| `apps/admin` | sim (`API_URL`, `ADMIN_USE_MOCK`, cookie) | só `API_URL` no dia a dia |
| `apps/mobile` | sim (`EXPO_PUBLIC_*`) | URL da API no device físico; Google IDs antes do TestFlight |
| Fastlane | sim (`apps/mobile/fastlane/.env`) | tudo, antes do primeiro build de loja |

Admin e mobile **caem em mock** se `GET {API_URL}/health` falhar em ~1,2s. Isso é proposital até a API existir. Force o modo com `ADMIN_USE_MOCK` / `EXPO_PUBLIC_USE_MOCK` (ver abaixo).

---

## Como ligar o ambiente local

```bash
docker compose up -d                       # postgres 5436 · minio 9100/9101 · mailpit 1026/8026
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/mobile/.env.example apps/mobile/.env
# opcional, só quando for gerar IPA/AAB:
cp apps/mobile/fastlane/.env.example apps/mobile/fastlane/.env
```

| serviço | URL / porta | user / senha (só local) |
|---|---|---|
| PostgreSQL | `localhost:5436` | `fitcupons` / `fitcupons` · db `fitcupons` |
| MinIO S3 | `localhost:9100` | `fitcupons` / `fitcupons123` |
| MinIO console | http://localhost:9101 | idem |
| Mailpit SMTP | `localhost:1026` | aceita qualquer auth |
| Mailpit web | http://localhost:8026 | — |
| pgAdmin (`--profile tools`) | http://localhost:5051 | `admin@fitcupons.local` / `fitcupons` |
| API (quando existir) | http://localhost:3000 | — |
| Admin | http://localhost:3001 | mock: `admin@fitcupons.app` / `fitcupons123` |

Portas deslocadas de propósito: 5432 é obrai, 5435 é duopace.

O profile `apps` do compose sobe API e admin em container, mas depende dos Dockerfiles (ainda não existem). No dia a dia os apps rodam com `yarn workspace … dev`.

---

## Checklist por etapa

Preencha só o que a etapa pede. O resto pode ficar vazio.

### 1. Dev local (hoje)

- [x] Docker: nada a criar
- [ ] `apps/api/.env` copiado (mesmo com a API ainda stub)
- [ ] `apps/admin/.env` com `API_URL=http://localhost:3000`
- [ ] `apps/mobile/.env` com `EXPO_PUBLIC_API_URL=http://localhost:3000` (simulador iOS / emulador)

### 2. Device físico ou emulador Android

- [ ] Descobrir o IP da máquina na LAN (`ipconfig getifaddr en0` no macOS)
- [ ] `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000` no mobile
- [ ] Android emulator (não device): use `http://10.0.2.2:3000` em vez de `localhost`
- [ ] `CORS_ORIGINS` na API: nativo não usa CORS; só importa se o admin ou o Expo web forem servidos de outro origin

### 3. Primeiro login Google / Apple no app

- [ ] Três OAuth clients no Google Cloud (iOS, Android, Web) → `EXPO_PUBLIC_GOOGLE_*` e `GOOGLE_CLIENT_ID_*` da API
- [ ] iOS URL scheme revertido no plugin (`com.googleusercontent.apps.{prefixo}`) — o `app.config.ts` deriva do iOS client ID
- [ ] Apple: Service ID, Team ID, Key ID, `.p8` → `APPLE_*` na API
- [ ] `APPLE_CLIENT_ID` = bundle `app.fitcupons` (Sign in with Apple)
- [ ] Revoke do grant Apple no delete de conta (Guideline 5.1.1(v)) — portar do duopace, não reescrever

### 4. E-mail de verdade (fora do Mailpit)

- [ ] SMTP de produção (`SMTP_URL`, `MAIL_FROM`)
- [ ] `API_URL` público para os links de verificar e-mail / reset de senha

### 5. Storage de produção

- [ ] Bucket S3 (ou compatível) + chaves
- [ ] `S3_PUBLIC_BASE_URL` alcançável pelo celular (não use hostname Docker)
- [ ] `DATABASE_URL` / `DIRECT_URL` do Postgres gerenciado + `DATABASE_CA_CERT` se o host exigir SSL

### 6. Conectores de oferta

- [ ] AliExpress Open Platform (o único 100% viável hoje): App Key, Secret, tracking ID
- [ ] Mercado Livre: app em developers.mercadolivre.com.br + `refresh_token` com `offline_access` (conta da tag `ALISSON3208`)
- [ ] Amazon Creators API: **deixar `AMAZON_ENABLED=false`** até a conta Associates ter 10 vendas qualificadas nos últimos 30 dias

### 7. TestFlight / Play Console (Fastlane)

- [ ] `apps/mobile/fastlane/.env` inteiro
- [ ] Match repo + senha
- [ ] App Store Connect API key `.p8`
- [ ] Keystore Android + JSON da Play Console
- [ ] Arquivos em `secrets/` (já gitignored)

---

## API — `apps/api/.env`

A API **ainda não lê estas variáveis** (não há Nest no disco). Quando o agente da API implementar, o boot deve usar `ConfigService.getOrThrow` **somente** no bloco obrigatório. Conector vazio = feature desligada, API sobe.

Fonte: `apps/api/.env.example` + `apps/api/SPEC.md` §3.

### Obrigatórias (falha no boot se faltar)

| Variável | Local default | Para quê | Onde obter |
|---|---|---|---|
| `NODE_ENV` | `development` | Nest / cookie `secure` no admin | — |
| `PORT` | `3000` | HTTP da API | — |
| `API_URL` | `http://localhost:3000` | Links absolutos em e-mail, redirect OAuth | URL pública em prod |
| `ADMIN_URL` | `http://localhost:3001` | CORS e redirects do painel | URL pública do admin |
| `CORS_ORIGINS` | `http://localhost:3001` | Origins permitidos (admin, Expo web). CSV | lista de origens, **sem** trailing slash |
| `DATABASE_URL` | `postgresql://fitcupons:fitcupons@localhost:5436/fitcupons` | Prisma (pooler, se houver) | painel do Postgres gerenciado |
| `DIRECT_URL` | igual ao `DATABASE_URL` no local | Migrações Prisma (conexão direta, sem pooler) | idem |
| `APP_JWT_SECRET` | placeholder local | Assina access JWT (app 30m + admin 2h) | gerar 32+ bytes; **nunca** o default em prod |
| `JWT_EXPIRES_IN` | `30m` | TTL do access token do app | — |
| `ADMIN_JWT_EXPIRES_IN` | `2h` | TTL do JWT do painel (sem refresh) | deve caber no cookie do admin (7200s) |
| `REFRESH_TOKEN_TTL_DAYS` | `60` | TTL do refresh opaco do app | — |
| `SMTP_URL` | `smtp://localhost:1026` | Nodemailer | Mailpit local; SES/Postmark em prod |
| `MAIL_FROM` | `fitcupons <nao-responda@fitcupons.app>` | From dos e-mails | domínio verificado no provedor |
| `S3_ENDPOINT` | `http://localhost:9100` | MinIO local / AWS em prod | console S3 |
| `S3_REGION` | `us-east-1` | SDK S3 (MinIO aceita qualquer) | região do bucket |
| `S3_BUCKET` | `fitcupons` | Fotos das ofertas (webp) | criar bucket |
| `S3_ACCESS_KEY_ID` | `fitcupons` | Credencial S3 | IAM / MinIO |
| `S3_SECRET_ACCESS_KEY` | `fitcupons123` | Credencial S3 | IAM / MinIO |
| `S3_FORCE_PATH_STYLE` | `true` | Obrigatório no MinIO; AWS costuma `false` | — |
| `S3_PUBLIC_BASE_URL` | `http://localhost:9100/fitcupons` | URL que o **celular** baixa. Não use `minio:9000` | CDN ou host público do bucket |
| `ADMIN_EMAIL` | `admin@fitcupons.app` | Seed do primeiro admin (idempotente) | e-mail real em prod |
| `ADMIN_PASSWORD` | `fitcupons123` no example | Seed; **nunca sobrescreve** admin já existente | senha forte em prod |

### Opcionais (vazio = desligado)

| Variável | Default / vazio | Para quê | Onde obter |
|---|---|---|---|
| `DATABASE_CA_CERT` | vazio | PEM do CA para Postgres SSL (duopace) | painel do host |
| `APP_SCHEME` | `fitcupons` | Deep link nos e-mails (`fitcupons://…`) | igual a `app.json` `scheme` |
| `GOOGLE_CLIENT_ID_IOS` | vazio | Valida `idToken` do Sign in with Google iOS | Google Cloud → OAuth client iOS |
| `GOOGLE_CLIENT_ID_ANDROID` | vazio | Idem Android | OAuth client Android (`app.fitcupons`) |
| `GOOGLE_CLIENT_ID_WEB` | vazio | Idem + `webClientId` no SDK | OAuth client Web |
| `APPLE_CLIENT_ID` | vazio | Service ID / bundle id do Sign in with Apple | Apple Developer |
| `APPLE_TEAM_ID` | vazio | JWT client secret Apple | Membership |
| `APPLE_KEY_ID` | vazio | Key de Sign in with Apple | Keys |
| `APPLE_PRIVATE_KEY` | vazio | Conteúdo da `.p8` (ou path, decidir na API) | download único da key |
| `INGESTION_CRON` | `0 */6 * * *` | Cron dos conectores | — |
| `OFFER_EXPIRE_CRON` | `15 3 * * *` | Expira ofertas vencidas | — |
| `SEED_DEMO` | `true` | ~40 ofertas + cliques de demo | `false` em prod |
| `SEED_IMAGE_STRATEGY` | `local` | `local` = gera webp e sobe no MinIO | `remote` se for URL pronta |
| `ALIEXPRESS_APP_KEY` | vazio | Conector de referência | [Open Platform](https://openservice.aliexpress.com/) |
| `ALIEXPRESS_APP_SECRET` | vazio | Idem | idem |
| `ALIEXPRESS_TRACKING_ID` | vazio | Atribuição de afiliado | painel AliExpress |
| `ML_CLIENT_ID` | vazio | App Mercado Livre | [developers.mercadolivre.com.br](https://developers.mercadolivre.com.br) |
| `ML_CLIENT_SECRET` | vazio | Idem | idem |
| `ML_REFRESH_TOKEN` | vazio | Obtido **uma vez** com `offline_access` na conta da tag | OAuth da conta `ALISSON3208` |
| `ML_AFFILIATE_TAG` | `ALISSON3208` | Tag do programa de afiliados (não há API) | painel de afiliados ML |
| `ML_AFFILIATE_URL_TEMPLATE` | `{permalink}?matt_word={tag}&matt_tool={tool}` | Como a tag entra na URL | observado, não documentado pelo ML |
| `ML_AFFILIATE_TOOL` | vazio | `matt_tool` do template | painel de afiliados |
| `ML_MIN_DISCOUNT_PERCENT` | `15` | Filtro do cron ML (SPEC §8.1) | — |
| `ML_MIN_SOLD_QUANTITY` | `1` | Filtro `sold_quantity` / item novo | — |
| `AMAZON_ENABLED` | `false` | **Manter false** até qualificar Associates | Creators API |
| `AMAZON_CLIENT_ID` | vazio | OAuth Creators API (não é mais PA-API/SigV4) | Amazon Associates |
| `AMAZON_CLIENT_SECRET` | vazio | Idem | idem |
| `AMAZON_PARTNER_TAG` | vazio | Tag de afiliado (`xxx-20`) | idem |

### Docker profile `apps`

O compose sobrescreve, dentro da rede Docker:

| Variável | Valor no container |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | `postgresql://fitcupons:fitcupons@postgres:5432/fitcupons` (porta **5432** interna) |
| `S3_ENDPOINT` | `http://minio:9000` |
| `S3_PUBLIC_BASE_URL` | `http://localhost:9100/fitcupons` — o celular fala com o host, não com `minio` |
| `SMTP_URL` | `smtp://mailpit:1025` |

---

## Admin — `apps/admin/.env`

Lidas em `apps/admin/src/lib/config.ts` e `auth.ts`. Cookie httpOnly `fc_admin` (nome fixo, SPEC).

| Variável | Obrigatória? | Default | Para quê |
|---|---|---|---|
| `API_URL` | sim, em prod | `http://localhost:3000` | Server-side fetch (login, `/admin/*`). **Não** precisa ser `NEXT_PUBLIC_` — o JWT não deve ir ao bundle |
| `NEXT_PUBLIC_API_URL` | não | — | Fallback legado se `API_URL` faltar. Evite: vaza o host da API no JS |
| `ADMIN_USE_MOCK` | não | `auto` | `auto` = sonda `/health`. `true`/`mock` = sempre mock. `false`/`live` = sempre API (falha visível se estiver fora) |
| `ADMIN_COOKIE_MAX_AGE_SECONDS` | não | `7200` (2h) | Deve casar com `ADMIN_JWT_EXPIRES_IN` |
| `NODE_ENV` | injetado pelo Next | `development` | `production` liga `Secure` no cookie — login quebra em HTTP |

No profile Docker `apps`, o admin recebe `API_URL=http://api:3000` (hostname interno).

Login mock (só com API fora / `ADMIN_USE_MOCK=true`): `admin@fitcupons.app` / `fitcupons123`. Com a API no ar, vale o admin do seed (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

---

## Mobile — `apps/mobile/.env`

O Expo **só embute** variáveis `EXPO_PUBLIC_*` no JS. Mude `.env` e **reinicie** o bundler (`expo start -c`).

| Variável | Obrigatória? | Default | Para quê |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | sim, fora do mock | `http://localhost:3000` (também em `app.json` `extra.apiUrl`) | Base da API. Simulador iOS: `localhost`. Android emulator: `10.0.2.2`. Device: IP LAN |
| `EXPO_PUBLIC_USE_MOCK` | não | `auto` | Igual ao admin: `true` força mock; `false` força API |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | para Google no iOS | vazio | OAuth client iOS. Também gera o URL scheme no `app.config.ts` |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | para Google no Android | vazio | OAuth client Android, package `app.fitcupons`, SHA-1 do keystore |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | para Google (idToken) | vazio | `webClientId` do SDK; a API valida o mesmo valor |

### Configs que **não** são env (mas você precisa acertar)

| Onde | Valor | Nota |
|---|---|---|
| `app.json` `scheme` | `fitcupons` | Deep link de verify/reset. A API deve emitir `fitcupons://…` |
| `ios.bundleIdentifier` / `android.package` | `app.fitcupons` | Precisa casar com Apple + Google + Fastlane `app_identifier` |
| `ios.usesAppleSignIn` | `true` | Capability no Apple Developer |
| Plugin Google `iosUrlScheme` | `com.googleusercontent.apps.{prefixo}` | Prefixo = iOS client ID sem `.apps.googleusercontent.com`. `app.config.ts` preenche a partir do env; o placeholder no `app.json` só vale se o env estiver vazio |
| `extra.apiUrl` | `http://localhost:3000` | Fallback se `EXPO_PUBLIC_API_URL` não existir no runtime |

`localhost` no iPhone físico **não** alcança a API da sua máquina.

---

## Fastlane — `apps/mobile/fastlane/.env`

Usado só na hora de assinar e enviar loja. Copiar o example; **não** commitar.

### iOS

| Variável | Para quê | Onde obter |
|---|---|---|
| `APPLE_TEAM_ID` | Time de desenvolvimento | Apple Developer → Membership |
| `APPLE_ID` | Apple ID que entra no portal | sua conta |
| `ITC_TEAM_ID` | Time do App Store Connect (se for diferente) | App Store Connect |
| `MATCH_GIT_URL` | Repo privado dos certs/profiles | criar repo vazio |
| `MATCH_PASSWORD` | Criptografa o Match | gerar e guardar no 1Password |
| `APP_STORE_CONNECT_KEY_ID` | Auth key | Users and Access → Integrations → App Store Connect API |
| `APP_STORE_CONNECT_ISSUER_ID` | UUID do issuer | idem |
| `APP_STORE_CONNECT_KEY_PATH` | `secrets/AuthKey_XXXXXXXX.p8` | download único |
| `IOS_SCHEME` | scheme Xcode (opcional) | default `fitcupons` |
| `IOS_DEVICE_UDID` | device de teste (opcional) | Xcode / `idevice_id` |
| `IOS_BUILD_NUMBER` | override (opcional) | senão: max(app.json, store+1) |

### Android

| Variável | Para quê | Onde obter |
|---|---|---|
| `ANDROID_KEYSTORE_PATH` | `secrets/fitcupons-release.keystore` | `keytool` uma vez |
| `ANDROID_KEYSTORE_PASSWORD` | senha do keystore | — |
| `ANDROID_KEY_ALIAS` | alias da key | — |
| `ANDROID_KEY_PASSWORD` | senha da key | — |
| `GOOGLE_PLAY_JSON_KEY_PATH` | service account Play | Play Console → API access |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | re-passado no prebuild | mesmo do app |
| `ANDROID_VERSION_CODE` | override (opcional) | senão: max(app.json, store+1) |
| `FASTLANE_PREBUILD_CLEAN` | `1` = limpa ios/android antes | — |

`Appfile` já fixa `app.fitcupons` nos dois stores.

---

## Docker Compose — env injetada (não vai em `.env` de app)

Definida em `docker-compose.yml`. Troque **antes** de expor a máquina.

| Serviço | Variável | Valor local |
|---|---|---|
| postgres | `POSTGRES_USER` | `fitcupons` |
| postgres | `POSTGRES_PASSWORD` | `fitcupons` |
| postgres | `POSTGRES_DB` | `fitcupons` |
| minio | `MINIO_ROOT_USER` | `fitcupons` |
| minio | `MINIO_ROOT_PASSWORD` | `fitcupons123` |
| mailpit | `MP_MAX_MESSAGES` | `500` |
| mailpit | `MP_SMTP_AUTH_ACCEPT_ANY` | `1` |
| mailpit | `MP_SMTP_AUTH_ALLOW_INSECURE` | `1` |
| pgadmin | `PGADMIN_DEFAULT_EMAIL` | `admin@fitcupons.local` |
| pgadmin | `PGADMIN_DEFAULT_PASSWORD` | `fitcupons` |

O `minio-init` usa as mesmas chaves do MinIO para criar o bucket `fitcupons` com download anônimo (o app carrega foto por URL pública).

---

## Mapa: o mesmo segredo em dois lugares

Alguns valores precisam **casar** entre apps. Se divergir, login ou imagem quebra.

| Conceito | API | Mobile / Admin / Fastlane |
|---|---|---|
| Base da API | `API_URL` | mobile `EXPO_PUBLIC_API_URL` · admin `API_URL` |
| Origin do painel | `ADMIN_URL` + `CORS_ORIGINS` | admin roda em `:3001` |
| Google iOS | `GOOGLE_CLIENT_ID_IOS` | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |
| Google Android | `GOOGLE_CLIENT_ID_ANDROID` | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` |
| Google Web | `GOOGLE_CLIENT_ID_WEB` | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (+ Fastlane) |
| Apple bundle / Service ID | `APPLE_CLIENT_ID` | `app.json` `bundleIdentifier` = `app.fitcupons` |
| Scheme de deep link | `APP_SCHEME` | `app.json` `scheme` = `fitcupons` |
| Admin seed | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | login do painel (quando a API estiver no ar) |
| JWT admin 2h | `ADMIN_JWT_EXPIRES_IN` | cookie `ADMIN_COOKIE_MAX_AGE_SECONDS=7200` |
| Tag ML | `ML_AFFILIATE_TAG=ALISSON3208` | — (só API) |

---

## O que ainda não existe no código (API)

Quando o backend for implementado, ele precisa:

1. Validar o bloco obrigatório no boot (`getOrThrow`).
2. Não derrubar o processo se AliExpress / ML / Amazon / Google / Apple estiverem vazios.
3. Seed idempotente do admin + catálogo de sports/categories/stores.
4. `GET /health` **sem auth** — é o interruptor mock→live dos clientes.
5. E-mails com links em `API_URL` e deep links `APP_SCHEME://`.
6. Portar auth Google/Apple/revoke do duopace (`/Users/alissonsilva/projects/duopace/api/src/auth/`).
7. Upload S3 com `sharp` → webp; URLs públicas via `S3_PUBLIC_BASE_URL`.
8. Cron `INGESTION_CRON` e `OFFER_EXPIRE_CRON`.

Clientes já prontos para isso: admin e mobile sondam `/health` e passam a chamar a API sozinhos.

---

## Segredos — o que nunca versionar

Já coberto pelo `.gitignore`:

- `**/.env` (exceto `.env.example`)
- `secrets/`
- `*.p8`, `*.keystore`, `*.jks`, `*.mobileprovision`
- `google-services.json`, `GoogleService-Info.plist`, JSON de service account
- `apps/api/prisma/db-ca.crt`

Rotacionar imediatamente se `APP_JWT_SECRET`, senha do admin, chaves S3 ou refresh token do ML vazarem.
