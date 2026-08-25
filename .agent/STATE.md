# Current Project State

Last updated: 2026-08-25

## Current

Iteration 0 foundation is implemented on PR #2 (`feat/iteration-0-bootstrap`). The extension now has a real WXT + React + strict TypeScript runtime, isolated Shadow DOM mount, unit test harness, lint/typecheck/build gates, and GitHub Actions verification.

## Last verified outcome

Workflow run `32819940794` verified the implementation commit with all runtime gates green:

- dependency installation: pass
- ESLint: pass
- strict TypeScript: pass
- Vitest: pass
- WXT production build: pass

The TypeScript failure encountered during bootstrap was traced to the root `tsconfig.json` overriding WXT's generated include set and missing React JSX configuration. The fix follows the WXT React template: inherit generated declarations and add `jsx: react-jsx`.

## Implemented

- WXT 0.21 Chromium MV3 foundation
- React content UI
- strict TypeScript configuration
- Shadow DOM-isolated Chatspace root on `https://chatgpt.com/*`
- harmless bootstrap status surface
- Vitest + Testing Library + jsdom
- ESLint flat config
- CI gates for install, lint, typecheck, test, and production build
- development README and repository ignores

## Hard constraints retained

- no undocumented/private ChatGPT endpoints
- no auth/session-cookie reuse
- no automated/programmatic extraction of ChatGPT data/output
- no protection/rate-limit bypass
- provider-specific behavior must remain isolated
- ChatGPT must remain usable if Chatspace fails or is hidden
- TDD/evidence before completion claims

## Known reliability gap

`package-lock.json` is not yet committed. Exact direct dependency versions are pinned and clean installation is verified, but transitive dependency reproducibility is not yet ideal. A workflow attempt to self-commit the generated lockfile was intentionally abandoned rather than granting persistent repository write access to CI. Close this gap during the reliability/store-readiness pass or through a trusted local package-manager environment; do not weaken dependency validation to hide it.

## Not implemented yet

- full safe shell controls/error boundary
- three-panel workspace
- persisted workspace domain
- nested folders/chat references
- tabs/command palette
- provider navigation adapter
- local Markdown notes
- graph navigation
- export/import/reset and store-readiness hardening
- optional Obsidian/filesystem bridge
- local semantic enrichment

## Compatibility state

Only origin-scoped isolated mounting is implemented. No provider DOM selectors, output extraction, or private provider integration exists.

## Next single priority

**Iteration 1 — Safe Extension Shell**, immediately followed by the local workspace vertical slice through Iterations 2–8.

The next implementation must preserve host recoverability: top-level error boundary, visible collapse/restore control, provider-independent local state, and no ownership of ChatGPT conversation internals.

## Blocked

No product blocker is known. Rich provider-derived semantic features remain intentionally constrained until a provider-supported data path exists.
