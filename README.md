# fitcupons

App de cupons, promoções e achados para quem pratica esporte — ciclismo, corrida, natação, beach tennis, vôlei e afins.

Monorepo yarn workspaces:

| pacote | o que é |
|---|---|
| `apps/api` | NestJS + Prisma + PostgreSQL. Serve o mobile, coleta ofertas em cron, conta cliques |
| `apps/admin` | Next.js. Painel de curadoria: cadastra, importa e modera ofertas |
| `apps/mobile` | Expo. O app: login, escolha de esportes, feed, resgate |
| `packages/shared` | Tipos de contrato, catálogo de esportes, tokens de cor |

## Documentação

Comece por **[`docs/PLAN.md`](docs/PLAN.md)** — contexto, decisões tomadas, riscos apurados e ordem de execução.

Variáveis de ambiente e configs: **[`docs/ENV.md`](docs/ENV.md)**.

Depois, a spec da parte em que for mexer:

- [`apps/api/SPEC.md`](apps/api/SPEC.md) — schema, autenticação, todos os endpoints (o feed em §6.1), conectores de afiliado
- [`apps/admin/SPEC.md`](apps/admin/SPEC.md) — login, rotas, cada tela campo a campo
- [`apps/mobile/SPEC.md`](apps/mobile/SPEC.md) — navegação, os três logins, onboarding, feed, Fastlane
- [`packages/shared/SPEC.md`](packages/shared/SPEC.md) — o que é compartilhado e por quê

## Infra local

```bash
docker compose up -d                  # postgres 5436 · minio 9100/9101 · mailpit 1026/8026
docker compose --profile tools up -d  # + pgadmin 5051
```

| serviço | para quê | onde |
|---|---|---|
| PostgreSQL | banco | `localhost:5436` |
| MinIO | S3 local, fotos das ofertas | console em http://localhost:9101 |
| Mailpit | captura os e-mails de verificação e reset de senha | http://localhost:8026 |

```bash
cp apps/api/.env.example apps/api/.env
```

## Status

Admin e mobile estão no ar com **mocks** até a API responder `GET /health`. Depois disso, os clientes passam a usar a API automaticamente.

```bash
yarn install
docker compose up -d
yarn workspace @fitcupons/admin dev    # http://localhost:3001  (admin@fitcupons.app / fitcupons123)
yarn workspace @fitcupons/mobile dev
```
