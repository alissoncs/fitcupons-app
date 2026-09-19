# packages/shared — Especificação

Pacote `@fitcupons/shared`. Código que a API, o admin e o mobile precisam enxergar igual.

**Regra de entrada:** só entra aqui o que **os três** (ou ao menos dois) consomem, e que quebra silenciosamente se divergir. Utilitário usado por um app só mora no app. Um pacote compartilhado que vira depósito passa a ser acoplamento, não reuso.

---

## Conteúdo

```
src/
├── index.ts
├── theme.ts          tokens de cor, raio, espaçamento
├── contracts/        tipos de request/response da API
│   ├── auth.ts
│   ├── offer.ts
│   ├── sport.ts
│   └── common.ts     Paginated<T>, ApiError, cursor
├── enums.ts          espelho dos enums do Prisma
├── sports.ts         catálogo canônico (slug, name, iconName)
└── format.ts         formatação de dinheiro e desconto
```

### `theme.ts`

Fonte única dos tokens da seção "Identidade visual" das specs do admin e do mobile. O admin renderiza a prévia do card de oferta com estes valores, e é isso que faz a prévia bater com o app de verdade.

Exporta `lightTheme` e `darkTheme` com as chaves `bg` `surface` `border` `ink` `inkMuted` `primary` `primarySoft` `accent` `accentSoft`.

### `contracts/`

Tipos puros de TypeScript (sem `class-validator`, sem decorators — o admin e o mobile não têm o runtime do Nest). A API deriva seus DTOs destes tipos; os clientes consomem direto. É o que impede o feed de quebrar porque alguém renomeou um campo na API.

### `enums.ts`

`AuthProvider`, `OfferStatus`, `OfferSource`, `DiscountType`, `RedeemAction`. Espelham o `schema.prisma`. Como são união de strings e não o enum gerado pelo Prisma, não arrastam `@prisma/client` para dentro do bundle do mobile.

### `sports.ts`

O catálogo canônico das 14 modalidades (`slug`, `name`, `iconName`). É a fonte do seed da API e o fallback do mobile quando o `GET /sports` falha — o onboarding não pode ficar em branco por causa de uma request perdida.

### `format.ts`

`formatCents(19990) → "R$ 199,90"` e `discountPercent(original, current) → 34`.

Compartilhar isto não é preciosismo: o percentual é calculado na API (para ordenar o feed) **e** exibido no admin e no mobile. Três implementações da mesma regra de arredondamento acabam divergindo, e o usuário vê "−34%" no card e "−33%" no detalhe.

---

## Build

`tsc` para `dist/`, com `types` e `main` apontando para lá. `"type": "module"`.

Cuidado conhecido: o Metro precisa resolver o pacote pelo workspace. Se der atrito, expor os fontes direto via `exports` em vez de compilar — mas decidir isso lendo a doc versionada do Expo sobre monorepo, não por tentativa e erro.
