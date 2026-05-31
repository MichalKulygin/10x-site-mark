---
project: 10x-site-mark
created: 2026-05-31
status: deployed
platform: Cloudflare Workers
production_url: https://10x-site-mark.michal-kulygin.workers.dev
account_id: beb684660c73b323029abd1810c5db6b
source_decision: context/foundation/infrastructure.md
tech_stack:
  language: TypeScript
  framework: Astro 6 (SSR)
  runtime: Cloudflare Workers (workerd) via @astrojs/cloudflare 13.5.0
---

## Cel

Runbook wdrożenia 10x-site-mark na Cloudflare Workers. Wyprowadzony z decyzji infrastrukturalnej w [`context/foundation/infrastructure.md`](../foundation/infrastructure.md) (rekomendacja: Workers, 5/5) i stacku z [`context/foundation/tech-stack.md`](../foundation/tech-stack.md). Migracja z Pages na Workers oraz pierwszy deploy są **wykonane i zweryfikowane** (2026-05-31).

## Stan docelowy (zrealizowany)

- **Platforma:** Cloudflare Workers (nie Pages — `@astrojs/cloudflare` v13 wspiera tylko Workers).
- **Produkcja:** https://10x-site-mark.michal-kulygin.workers.dev
- **Konto Cloudflare:** `beb684660c73b323029abd1810c5db6b` (michal.kulygin@gmail.com), `account_id` zapięty w `wrangler.toml`.
- **Adapter:** `@astrojs/cloudflare` przypięty do dokładnej wersji `13.5.0` (bez caret — mityguje ryzyko H/H z risk-register).
- **Build:** `npm run build` = `astro build` (bez post-buildu; hack `scripts/fix-wrangler.mjs` usunięty).
- **Mechanizm deployu:** `wrangler deploy` używa redirected config — `.wrangler/deploy/config.json` → `dist/server/wrangler.json` (generowane przez `@cloudflare/vite-plugin` z policzonymi `main: entry.mjs` i `assets.binding: ASSETS`, `directory: ../client`).
- **Dane:** Supabase zewnętrznie (auth/DB/storage); klient PostgREST przez `@supabase/ssr`.

## Konfiguracja (pliki w repo)

- `wrangler.toml` — `name`, `account_id`, `compatibility_date = "2026-05-08"`, `compatibility_flags = ["nodejs_compat"]`, `[observability] enabled = true`. **Bez** `pages_build_output_dir`, **bez** ręcznych `main`/`[assets]`.
- `astro.config.mjs` — `output: "server"`, `cloudflare({ imageService: "passthrough" })`, `session: { driver: "memory" }`, env schema dla `SUPABASE_URL`/`SUPABASE_KEY`. Bez zmian względem migracji.
- `package.json` — `"build": "astro build"`, `"@astrojs/cloudflare": "13.5.0"`.
- `.dev.vars` (gitignored) — `SUPABASE_URL`/`SUPABASE_KEY` dla lokalnego `wrangler dev`.

## Sekrety

| Sekret | Gdzie | Po co |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_KEY` | Workers Secrets (`wrangler secret put`) | Runtime wdrożonego Workera |
| `SUPABASE_URL`, `SUPABASE_KEY` | GitHub repo secrets | Krok `npm run build` w CI |
| `CLOUDFLARE_API_TOKEN` | GitHub repo secret (token „Edit Cloudflare Workers") | Auto-deploy z CI |

Rotacja: ponowny `wrangler secret put <NAME>` (Workers) lub `gh secret set <NAME>` (GitHub) + redeploy. `account_id` to publiczny identyfikator — trzymany w repo, nie jako sekret.

## CI/CD — auto-deploy-on-merge

`.github/workflows/ci.yml`:
- Job `ci` — lint + build na push i PR do `main` (gate jakości; PR-y kończą się tutaj).
- Job `deploy` — `needs: ci`, `if: github.event_name == 'push'` (tylko push do `main`): `npm ci` → `astro sync` → `npm run build` → `cloudflare/wrangler-action@v3` z `command: deploy` i `apiToken: CLOUDFLARE_API_TOKEN`. `accountId` nie jest potrzebny (jest w `wrangler.toml`).

Stan: re-run 2026-05-31 — `ci` ✓ + `deploy` ✓ (pierwszy przebieg padł na transient Cloudflare API code 10013, ponowienie przeszło).

## Procedury operacyjne

- **Deploy ręczny:** `npx wrangler deploy` (po `npm run build`).
- **Rollback:** `npx wrangler rollback [version-id]` (natychmiastowy); historia: `npx wrangler versions list`. Uwaga: rollback kodu **nie** cofa migracji bazy w Supabase — traktuj je osobno.
- **Logi:** `npx wrangler tail` (live runtime), `npx wrangler deployments list` (historia). Observability włączone w `wrangler.toml`.
- **Preview:** `npx wrangler versions upload` tworzy preview URL bez promocji na produkcję.
- **Approval:** agent może bez nadzoru: deploy nie-produkcyjny, `tail`, `versions list`. Wymaga człowieka: promocja na produkcję, rotacja sekretu produkcyjnego, operacje na bazie Supabase (drop/migracja).

## Weryfikacja (po deployu)

```
curl -i https://10x-site-mark.michal-kulygin.workers.dev/auth/signin   # -> 200, text/html (SSR)
curl -i https://10x-site-mark.michal-kulygin.workers.dev/dashboard      # -> 302 -> /auth/signin (middleware)
```

Stan na 2026-05-31: `/` → 200, `/auth/signin` → 200 `text/html`, `/dashboard` → 302 na login. SSR + middleware potwierdzone; sekrety dotarły do Workera (klient Supabase wystartował bez crasha).

## Pozostałe / do obserwacji

- **Wycofać stary projekt Pages** w panelu Cloudflare (wymaga dashboardu) — żeby nie utrzymywać dwóch wdrożeń.
- **Deprecation Node 20 w akcjach GH** — `actions/checkout@v4`, `setup-node@v4`, `wrangler-action@v3` przejdą na Node 24 (16 cze 2026); bumpnąć wersje przy okazji.
- **Limity CPU Workers vs parsowanie DXF** (risk-register, M/H) — renderować/parsować DXF po stronie klienta; jeśli musi być server-side, mierzyć CPU-ms.
- **`session: memory`** nie persystuje między izolatami Workers — przy zależności od serwerowych sesji rozważyć driver KV (adapter auto-włącza binding `SESSION`).

## Powiązane dokumenty

- Decyzja platformowa, scoring, risk-register: [`context/foundation/infrastructure.md`](../foundation/infrastructure.md)
- Stack i hand-off: [`context/foundation/tech-stack.md`](../foundation/tech-stack.md)
- Zasady repo dla agentów (hard rules deployu): [`AGENTS.md`](../../AGENTS.md)
