# Current Project State

Last updated: 2026-08-25

## Current

Iteration 1 — Safe Extension Shell is implemented on `feat/v1-workspace` after the verified v1 domain core.

## Last verified outcome

Commit `71900f9f5289fe39a19cdb341a397fd0def95c69` passed CI with dependency installation, ESLint, strict TypeScript, Vitest, and WXT production build all green.

## Implemented

- WXT + React Chromium MV3 foundation
- strict TypeScript
- Shadow DOM-isolated content UI on `https://chatgpt.com/*`
- provider-independent workspace domain model
- workspace reducer and schema validation/import/export contracts
- graph projection with canonical/manual provenance
- safe ChatGPT URL-reference adapter
- `chrome.storage.local` repository abstraction
- Iteration 1 recoverable shell with explicit hide/restore controls
- top-level error boundary that fails closed while leaving ChatGPT usable

## Hard constraints retained

- no undocumented/private ChatGPT endpoints
- no auth/session-cookie reuse
- no automated/programmatic extraction of ChatGPT data/output
- no protection/rate-limit bypass
- provider-specific behavior remains isolated
- ChatGPT remains usable if Chatspace fails or is hidden
- TDD/evidence before completion claims

## Known reliability gap

`package-lock.json` is not yet committed. Exact direct dependency versions are pinned; close this during Iteration 8 store-readiness without granting persistent repository write permission to CI.

## Compatibility state

Origin-scoped mount plus explicit URL-only ChatGPT navigation reference support. No provider DOM selectors, conversation scraping, history crawling, private endpoints, or provider credentials.

## Next single priority

**Iteration 2 — Spatial Workspace Layout.**

Build the three-panel editor-like workspace shell while preserving the recoverable hide/restore behavior and host coexistence.

## Blocked

No product blocker is known.
