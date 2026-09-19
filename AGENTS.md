# fitcupons

Monorepo yarn workspaces: `apps/api` (NestJS), `apps/admin` (Next.js), `apps/mobile` (Expo), `packages/shared`.

## Antes de implementar

Ler, nesta ordem:

1. `docs/PLAN.md` — contexto, decisões tomadas, riscos apurados e ordem de execução.
2. A `SPEC.md` da pasta em que você vai mexer (`apps/api/SPEC.md`, `apps/admin/SPEC.md`, `apps/mobile/SPEC.md`, `packages/shared/SPEC.md`).

## Regras do projeto

- **Código, schema, rotas e nomes em inglês. UI em pt-BR.** Sem camada de i18n.
- **Dinheiro é sempre inteiro em centavos.** Nunca float, nunca Decimal no JSON.
- **Expo mudou.** Ler os docs versionados da SDK alvo em `https://docs.expo.dev/versions/vXX.0.0/` antes de escrever código de mobile. Não escrever de memória.
- **Reaproveitar o duopace.** `/Users/alissonsilva/projects/duopace/api/src/auth/` já resolve Google, Apple e o revoke do grant Apple exigido pela Guideline 5.1.1(v). Portar, não reescrever.
- **Sem LLM no parser de ofertas.** Decisão de projeto: regex e heurística determinística.
- **Sem testes automatizados por enquanto.** Manter simples; a verificação é manual e está em `docs/PLAN.md`.
- **Infra local:** `docker compose up -d` na raiz (postgres 5436, MinIO 9100, Mailpit 8026).
