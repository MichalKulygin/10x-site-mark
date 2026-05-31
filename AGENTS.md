# Repository Guidelines

10x-site-mark is an Astro 6 SSR app (React 19 islands, Tailwind 4, Supabase auth, shadcn/ui) deployed to Cloudflare Workers. See `@CLAUDE.md` for full architecture and `@README.md` for the stack overview.

## Hard rules

- **API routes must export `const prerender = false`.** The app is full SSR (`output: "server"`); a route without it is statically prerendered and breaks at runtime.
- **Deploy targets Cloudflare Workers, not Pages** (`@astrojs/cloudflare` v13 dropped Pages). `npm run build` is just `astro build`; the adapter emits `dist/server/entry.mjs` plus a generated `dist/server/wrangler.json` (computed `main`/`assets`) discovered via `.wrangler/deploy/config.json`. Deploy with `wrangler deploy`. Do NOT add `main`, `[assets]`, or `pages_build_output_dir` to `wrangler.toml` — the adapter computes them.
- **Read Supabase secrets via `astro:env/server`** (`SUPABASE_URL`, `SUPABASE_KEY`), declared in `astro.config.mjs` `env.schema` — not `import.meta.env`.
- **Enable RLS on every new Supabase table** with granular per-operation, per-role policies.

## Project Structure

- `src/pages/` — routes; `src/pages/api/auth/{signin,signup,signout}.ts` are API endpoints.
- `src/components/` — `.astro` for static/layout, `.tsx` only for interactive islands; `src/components/ui/` is shadcn ("new-york").
- `src/lib/` — services/helpers (`supabase.ts`, `utils.ts`); `src/middleware.ts` resolves `locals.user` and gates `PROTECTED_ROUTES`.
- `src/types.ts` — shared entities/DTOs. `supabase/migrations/` — `YYYYMMDDHHmmss_desc.sql`.
- `context/foundation/` — product docs (`@context/foundation/prd.md`, `tech-stack.md`).

## Commands

Scripts are defined in `@package.json` (`dev`, `build` = `astro build`, `lint`, `format`). Deploy with `wrangler deploy` (see Hard rules).

## Coding Conventions

- Path alias `@/*` → `src/*`. Merge classes with `cn()` from `@/lib/utils`; never concatenate class strings.
- API handlers: uppercase `GET`/`POST` exports, validate input with zod.
- React: no Next.js directives (`"use client"`); extract hooks to `src/components/hooks/`.
- Node version pinned in `@.nvmrc`. Add shadcn components via `npx shadcn@latest add <name>`.

## Commit & CI

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Pre-commit hook runs `eslint --fix` + `prettier --write` (husky + lint-staged). CI (`.github/workflows/ci.yml`): `ci` job lints + builds on push/PR to `main`; `deploy` job runs `wrangler deploy` on push to `main` (needs `CLOUDFLARE_API_TOKEN` + `SUPABASE_*` secrets). No test suite is configured yet.
    