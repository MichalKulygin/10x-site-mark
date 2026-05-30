---
starter_id: 10x-astro-starter
package_manager: npm
project_name: 10x-site-mark
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

Solo developer shipping a field-work annotation MVP in 4 after-hours weeks. 10x-astro-starter is the recommended default for (web-app, js) and clears all four agent-friendly gates: typed (TypeScript + Zod), convention-based (Astro file-based routing), popular in training data, and well-documented. Supabase covers the three technology-forcing features from the PRD: auth (FR-005: email + password), PostgreSQL for persisting drawings (FR-004), and file storage for DXF imports (FR-001) — all included without additional wiring. The offline layer (NFR-01, FR-004 offline guardrail) requires manual addition of a service worker and local cache, which is standard PWA work independent of the starter choice. Cloudflare Pages is the starter's default deploy target; GitHub Actions with auto-deploy-on-merge matches the solo workflow without staging gates.
