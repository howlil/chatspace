# Current Project State

Last updated: 2026-08-25

## Current

Iterations 1–10 are implemented on `feat/v1-workspace`. Iterations 1–9 have fresh green CI evidence; Iteration 10 is the final gated increment on the same branch and must pass lint, strict typecheck, tests, and production build before merge.

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

Direct dependency versions are exact-pinned and CI is green through Iteration 9. A committed npm lockfile remains desirable before public package/store distribution; it is not generated or committed by CI because CI intentionally has read-only repository permissions.

## Next single priority

**Close Iteration 10 gate, perform final PR verification, then merge.**

## Blocked

No product blocker is known.
