---
project: 10x-site-mark
researched_at: 2026-05-31
recommended_platform: Cloudflare Workers
runner_up: Netlify
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 6 (SSR)
  runtime: Cloudflare Workers (workerd) via @astrojs/cloudflare v13
---

## Rekomendacja

**Wdrażaj na Cloudflare Workers** (nie Cloudflare Pages).

Cloudflare uzyskało komplet 5/5 w kryteriach agent-friendly, ma najhojniejszy free tier (100k requestów/dzień bez karty), najlepszą dokumentację dla agentów (`llms.txt`, docs-for-agents) i remote MCP server w statusie GA. Decydujący jest jednak hard-constraint ze stacku: **`@astrojs/cloudflare` v13 całkowicie porzucił wsparcie dla Pages i celuje wyłącznie w Workers**. Projekt jest dziś wdrożony na Pages dzięki obejściu (`scripts/fix-wrangler.mjs`), które wymusza format `_worker.js` — to ścieżka deprecjonowana i krucha. Migracja Pages → Workers (ten sam runtime, ten sam adapter, ta sama domena) **upraszcza** projekt: usuwa hack zamiast dokładać warstwę. Znajomość Cloudflare (wywiad Q3) i jeden region (Q4) potwierdzają wybór; Supabase pozostaje zewnętrznym dostawcą auth/DB/storage (Q5).

## Porównanie platform

| Platforma | CLI-first | Managed/Serverless | Docs agent-readable | Stabilne API deploy | MCP/Integracja | Wynik |
|---|---|---|---|---|---|---|
| **Cloudflare Workers** | Pass | Pass | Pass | Pass | Pass (GA) | **5/5** |
| **Netlify** | Pass | Pass | Pass | Pass | Pass (GA) | **5/5** |
| **Render** | Pass | Pass | Partial | Pass | Pass (GA) | **4.5/5** |
| Vercel | Pass | Pass | Pass | Pass | Partial | 4.5/5 |
| Railway | Pass | Pass | Pass | Pass | Partial | 4/5 |
| Fly.io | Pass | Partial | Pass | Pass | Partial | 3.5/5 |

Hard-filtry: brak. PRD nie wymaga realtime (wywiad Q1 = „nie wiem", traktowane jako nie-wymagane); JS/Astro SSR jest wspierany na każdej platformie. Wagi miękkie z wywiadu: koszt ≈ DX (neutralne), znajomość Cloudflare (tie-break), jeden region (premia edge nieistotna), zewnętrzny Supabase (współ-lokalizacja bez znaczenia).

- **Cloudflare Workers** — 5/5. Free 100k req/dzień; `wrangler deploy/rollback/tail`; doskonałe docs dla agentów; remote MCP GA (kwi 2025). Caveat: adapter v13 wspiera tylko Workers, nie Pages.
- **Netlify** — 5/5. Oficjalny MCP GA (cze 2025); „Astro 6 just works"; hojny free tier kredytowy. Caveat: adapter 6.5.0–6.5.1 miał regresje SSR/Edge — przypiąć znaną-dobrą wersję. Brak WebSockets (wymaga zewn. providera).
- **Render** — 4.5/5. Goły serwer Node (`@astrojs/node`), $7/mo always-on bez ograniczeń komercyjnych, natywne WebSockets (hedge na „nie wiem" z Q1), MCP GA (sie 2025). Caveat: free tier usypia po 15 min (cold start ~30–60s); docs jako HTML, nie markdown na GitHub.
- **Vercel** — 4.5/5, poza podium. Powód wykluczenia: **tier Hobby jest wyłącznie niekomercyjny** — realny produkt terenowy = Pro $20/mo od pierwszego dnia. MCP tylko read-only.
- **Railway** — 4/5. `@astrojs/node` przez Railpack, bez Dockerfile; ~$5/mo Hobby; MCP w statusie preview/WIP; brak stałego free tier.
- **Fly.io** — 3.5/5. Wymaga Dockerfile i więcej ops; brak free tier (~$2–6/mo); MCP experimental.

### Shortlist

#### 1. Cloudflare Workers (rekomendowane)

Najwyższy wynik, najlepszy free tier, najlepsze docs dla agentów, MCP GA — a do tego jedyna platforma, którą już znasz i na której projekt już stoi. Wspierana ścieżka adaptera v13 (`wrangler deploy` → Workers) eliminuje obecny hack `fix-wrangler.mjs`. `npm run dev`/`preview` używają już realnego runtime `workerd` przez Cloudflare Vite plugin, więc lokalnie masz wierność produkcji.

#### 2. Netlify

Czystszy model serverless niż dzisiejszy chaos Pages-vs-Workers; oficjalny MCP GA i potwierdzone wsparcie Astro 6. Gap vs rekomendacja: konieczność pilnowania wersji adaptera (regresje 6.5.x), brak WebSockets, oraz zerowa przewaga „już to znam / już wdrożone", którą ma Cloudflare.

#### 3. Render

Najprostszy model mentalny — goły serwer Node bez limitów CPU per-request (istotne przy parsowaniu DXF), natywne WebSockets i brak ograniczeń komercyjnych. Gap vs rekomendacja: płatny od $7/mo dla always-on (free usypia), docs słabiej przyswajalne dla agenta, brak znajomości i edge-CDN.

## Anti-bias cross-check: Cloudflare Workers

### Devil's advocate — słabości
1. **Obecny setup to fragilny hack.** `fix-wrangler.mjs` zmusza format `_worker.js` Pages, podczas gdy v13 chce `wrangler deploy` → Workers. Każdy minor-bump adaptera może wywrócić post-build i po cichu wrócić 404 na SSR.
2. **workerd ≠ Node.** API tylko-Node (`node:fs`, edge-case'y `Buffer`/`crypto`, część pakietów npm) może paść w runtime mimo zielonego lint/build lokalnie. `nodejs_compat` łata, ale nie w 100%.
3. **Limity CPU na request.** Workers liczy CPU-ms; parsowanie/renderowanie DXF server-side (główne ryzyko techniczne z PRD) może przekroczyć budżet CPU. Rendering po stronie klienta to omija.
4. **Brak trwałego procesu.** Jeśli „nie wiem" z Q1 zmieni się w „tak, potrzebuję workera/WS", wpadasz w Durable Objects — trudniejszy paradygmat niż goły serwer Node na Render/Railway.
5. **Koszt migracji mid-flight.** Przepięcie CI z Pages na Workers, ponowne ustawienie sekretów (`wrangler secret put`), być może nowy projekt Workers — realna, choć jednorazowa robota.

### Pre-mortem — jak to mogłoby się wywalić
Solo dev zostawił deploy na Cloudflare Pages z hackiem `fix-wrangler.mjs`, bo „działa". Trzy miesiące później rutynowy `npm update` podbił `@astrojs/cloudflare` z 13.5 na 13.9; struktura outputu drgnęła, hack przestał pasować, a Pages — zamiast błędu — po cichu zaczął serwować statyczne assety. Logowanie i dashboard zwracały 404 tylko na produkcji; lokalnie wszystko śmigało (`workerd` przez Vite plugin). Diagnoza zajęła wieczór, bo nikt nie podejrzewał deploya. Pod presją dev przepisał deploy na Workers w pośpiechu, ale przeoczył, że server-side parsing DXF przekracza limit CPU Workers przy większych plikach — część rzutni renderowała się pusta. Właściwa ścieżka (Workers + DXF po stronie klienta) była znana od początku z tego researchu, ale została odłożona „na potem", którego nie było. Koszt: dwa wieczory debugowania produkcji zamiast jednej świadomej migracji na starcie.

### Unknown unknowns
- **Hack `fix-wrangler.mjs` to objaw, nie rozwiązanie** — jesteś na deprecjonowanej ścieżce Pages z adapterem, który jej nie wspiera. Wspierana ścieżka to `wrangler deploy` na Workers.
- **Supabase z edge:** bezpośrednie połączenia `pg` z Workers to anty-wzorzec; klient PostgREST (którego używa starter) jest OK, ale każdy bezpośredni SQL wymagałby Hyperdrive.
- **Limit rozmiaru Workera** (~1 MB skompresowanej logiki) — duże zależności server-side mogą się nie zmieścić.
- **DXF to główne ryzyko z PRD** — decyzja „parsing client-side vs server-side" jest teraz też decyzją infrastrukturalną przez limity CPU Workers.
- **`workerd` lokalnie maskuje różnice** — `dev`/`preview` używają realnego runtime, więc część rozbieżności wyłapiesz lokalnie, ale nie limity CPU/rozmiaru (te biją dopiero w deployu).

## Operational Story

- **Preview deploys**: `wrangler versions upload` tworzy preview URL bez promocji na produkcję; PR-preview automatyzowalne przez Workers Builds (git-integracja, GA) lub `cloudflare/wrangler-action` w GitHub Actions. Preview URL-e można chronić przez Cloudflare Access.
- **Secrets**: `SUPABASE_URL` i `SUPABASE_KEY` jako Workers Secrets — `wrangler secret put <NAME>` (zaszyfrowane, niewidoczne po zapisie). W CI: token `CLOUDFLARE_API_TOKEN` w GitHub Secrets. Rotacja: ponowny `wrangler secret put` + redeploy.
- **Rollback**: `wrangler rollback [version-id]` — natychmiastowy powrót do poprzedniej wersji; `wrangler versions list` pokazuje historię. Uwaga: rollback kodu nie cofa migracji bazy w Supabase — migracje DB traktuj osobno.
- **Approval**: agent może bez nadzoru: `wrangler deploy` na środowisko nie-produkcyjne, `wrangler tail`, `wrangler versions list`. Wymaga człowieka: promocja na produkcję, rotacja sekretu produkcyjnego, operacje na bazie Supabase (drop/migracja).
- **Logs**: `wrangler tail` (live, runtime) i `wrangler deployments list` (historia deployów) — read-only, w pełni z CLI. Observability włączone w `wrangler.toml` (`[observability] enabled = true`).

## Risk Register

| Ryzyko | Źródło | Prawdopod. | Wpływ | Mitygacja |
|---|---|---|---|---|
| Hack `fix-wrangler.mjs` pęka po bumpie adaptera → ciche 404 na SSR | Devil's advocate / Research | H | H | Zmigrować Pages → Workers (`wrangler deploy`), usunąć hack i `pages_build_output_dir`; przypiąć wersję `@astrojs/cloudflare` |
| Parsowanie DXF server-side przekracza limit CPU Workers | Pre-mortem / Unknown unknowns | M | H | Renderować/parsować DXF po stronie klienta; jeśli musi być server-side — mierzyć CPU-ms i rozważyć podział pracy |
| API tylko-Node pada na `workerd` mimo zielonego buildu | Devil's advocate | M | M | Trzymać `nodejs_compat`; testować na `npm run preview` (realny workerd) przed deployem; unikać pakietów zależnych od `node:fs` |
| Pula połączeń do Supabase wyczerpana przy bezpośrednim SQL z edge | Unknown unknowns | L | M | Używać klienta PostgREST (`@supabase/ssr`, jak w starterze); dla bezpośredniego SQL dodać Hyperdrive |
| Przyszła potrzeba trwałego procesu/WS wymusza Durable Objects | Devil's advocate | L | M | Odłożone z realtime do v2; jeśli wróci — Durable Objects (free tier dostępny) albo przenieść tę część na Render |
| Koszt jednorazowej migracji CI Pages → Workers | Devil's advocate | M | L | Użyć Workers Builds (git-integracja, odpowiednik Pages CI) — minimalna zmiana w stosunku do obecnego auto-deploy-on-merge |

## Getting Started

Migracja z obecnego deployu na Pages do wspieranej ścieżki Workers (ten sam adapter v13, ten sam runtime). Zweryfikowane względem `@astrojs/cloudflare` v13.5 i Astro 6 w stacku.

1. **Usuń obejście Pages**: skasuj `scripts/fix-wrangler.mjs` i przywróć w `package.json` `"build": "astro build"`.
2. **Potwierdź output jednym czystym buildem**: `rm -rf dist .wrangler/deploy && npm run build`. Adapter v13 (przez `@cloudflare/vite-plugin`) emituje natywnie `dist/server/entry.mjs` (worker entry), `dist/client/` (assety) i `dist/server/wrangler.json` z policzonymi `main`/`assets`.
3. **Wyczyść `wrangler.toml`**: usuń **tylko** `pages_build_output_dir`. **Nie dodawaj** `main` ani `[assets]` — adapter liczy je sam i wpisuje do generowanego `dist/server/wrangler.json`; ręczne ustawienie grozi błędną ścieżką. Zachowaj `name`, `compatibility_date`, `compatibility_flags = ["nodejs_compat"]` i `[observability]`.
4. **`astro.config.mjs` zostaje bez zmian** — `cloudflare({ imageService: "passthrough" })` i `session: { driver: "memory" }` to już poprawna konfiguracja dla Workers.
5. **Ustaw sekrety na Workers**: `npx wrangler secret put SUPABASE_URL` i `npx wrangler secret put SUPABASE_KEY` (zamiast zmiennych w panelu Pages).
6. **Deploy + auto-deploy**: `npx wrangler deploy` ręcznie; dla auto-deploy-on-merge podłącz repo przez **Workers Builds** (git-integracja Cloudflare, GA — bezpośredni odpowiednik Pages CI, zero zmian w GitHub Actions) lub dodaj krok `cloudflare/wrangler-action` do `.github/workflows/ci.yml`.
7. **Zweryfikuj SSR po deployu**: sprawdź, że `/auth/signin` i `/dashboard` zwracają realny HTML (nie 404) — to test, że worker serwuje SSR, a nie tylko statyczne assety.

## Out of Scope

W tym researchu nie oceniano:
- Konfiguracji obrazów Docker
- Szczegółowej konfiguracji pipeline'u CI/CD (tu tylko wskazano opcje)
- Architektury produkcyjnej skali (multi-region, HA, DR)
