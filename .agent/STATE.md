# Current Project State

Last updated: 2026-08-25

## Current

Iterations 1–10 are implemented and verified green on `feat/v1-workspace`. Iteration 10 head `974f2d7fe26c50d7da70bfbeff81027a3922d7cd` passed lint, strict typecheck, tests, and production build in CI run `32831037064`.

## Implemented

- recoverable WXT + React Chromium MV3 shell on `https://chatgpt.com/*`
- strict TypeScript and Shadow DOM isolation
- extension-owned `chrome.storage.local` workspace persistence
- nested folders, saved URL-only ChatGPT references, tabs, and command palette
- Markdown notes linked to saved conversation references
- graph projection with canonical, manual, and deterministic `derived-local` provenance
- validated import/export/reset plus corruption recovery that blocks unsafe overwrite
- privacy and security documentation
- optional authenticated localhost Obsidian/filesystem bridge with session-only token
- deterministic local semantic enrichment based only on user-authored note title/tags/content
- related-note navigation in both graph and note workspace

## Hard constraints retained

- no undocumented/private ChatGPT endpoints
- no auth/session-cookie reuse
- no automated/programmatic extraction of ChatGPT data/output
- no protection/rate-limit bypass
- provider-specific behavior remains isolated
- ChatGPT remains usable if Chatspace fails or is hidden
- semantic enrichment is deterministic/local and carries explicit provenance
- TDD/evidence before completion claims

## Compatibility state

Origin-scoped mount plus explicit URL-only ChatGPT navigation reference support. No provider DOM selectors, conversation scraping, history crawling, private endpoints, or provider credentials.

## Release note

Direct dependency versions are exact-pinned. A committed npm lockfile remains desirable before public package/store distribution; CI intentionally has read-only repository permissions and does not write generated lockfiles back to the repository.

## Next single priority

**Final PR mergeability verification and merge of PR #3.**

## Blocked

No product blocker is known.
