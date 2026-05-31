# Repository Guidelines

10x-site-mark is an Astro 6 SSR app (React 19 islands, Tailwind 4, Supabase auth, shadcn/ui) deployed to Cloudflare Pages. See `@CLAUDE.md` for full architecture and `@README.md` for the stack overview.

## Hard rules

- **API routes must export `const prerender = false`.** The app is full SSR (`output: "server"`); a route without it is statically prerendered and breaks at runtime.
- **`npm run build` runs `scripts/fix-wrangler.mjs` afterward — never bypass it.** That script restructures `dist/` for Cloudflare Pages (`_worker.js` + rewritten `wrangler.json`) to work around `@astrojs/cloudflare` v13. Deploying raw `dist/` fails. Don't "simplify" or hand-edit the generated `dist/server/wrangler.json`. See `@scripts/fix-wrangler.mjs`.
- **Read Supabase secrets via `astro:env/server`** (`SUPABASE_URL`, `SUPABASE_KEY`), declared in `astro.config.mjs` `env.schema` — not `import.meta.env`.
- **Enable RLS on every new Supabase table** with granular per-operation, per-role policies.

## Project Structure

- `src/pages/` — routes; `src/pages/api/auth/{signin,signup,signout}.ts` are API endpoints.
- `src/components/` — `.astro` for static/layout, `.tsx` only for interactive islands; `src/components/ui/` is shadcn ("new-york").
- `src/lib/` — services/helpers (`supabase.ts`, `utils.ts`); `src/middleware.ts` resolves `locals.user` and gates `PROTECTED_ROUTES`.
- `src/types.ts` — shared entities/DTOs. `supabase/migrations/` — `YYYYMMDDHHmmss_desc.sql`.
- `context/foundation/` — product docs (`@context/foundation/prd.md`, `tech-stack.md`).

## Commands

Scripts are defined in `@package.json`. Note: `npm run build` also runs `scripts/fix-wrangler.mjs` afterward (see Hard rules); `dev`, `lint`, and `format` are standard.

## Coding Conventions

- Path alias `@/*` → `src/*`. Merge classes with `cn()` from `@/lib/utils`; never concatenate class strings.
- API handlers: uppercase `GET`/`POST` exports, validate input with zod.
- React: no Next.js directives (`"use client"`); extract hooks to `src/components/hooks/`.
- Node version pinned in `@.nvmrc`. Add shadcn components via `npx shadcn@latest add <name>`.

## Commit & CI

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Pre-commit hook runs `eslint --fix` + `prettier --write` (husky + lint-staged). CI (`.github/workflows/ci.yml`) runs lint + build on push/PR to `main` and requires `SUPABASE_URL`/`SUPABASE_KEY` secrets. No test suite is configured yet.
    