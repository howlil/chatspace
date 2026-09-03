# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Keep local note links trustworthy as notes are renamed and repaired.

## Feature Compass

**Shape:** `[[Title]]` remains canonical Markdown, now with optional `[[Title|label]]` aliases. Note title changes rewrite only inbound links that uniquely resolved to the target before the rename, preserving aliases and fenced code. Link context reports resolved/unresolved/ambiguous counts and exposes explicit recovery hooks without adding a backlink database.

**Position:** M13 — Link Integrity & Refactoring is complete and ready to integrate.

**Delta:** Added alias-aware parsing/rendering, rename-safe link rewriting at the workspace reducer boundary, tab-title alignment, deterministic diagnostics, broken-link recovery surfaces, and coverage for ambiguous/unresolved/fenced cases. Existing live title editing remains supported while each persisted transition preserves link integrity.

**Next Move:** Execute the already-approved M14 — Capture Inbox milestone from fresh `master` after M13 integration.

## Scope

### In

- `[[Title|display label]]` aliases;
- rename-safe inbound wikilink rewriting;
- no rewrite for links that were unresolved or ambiguous before rename;
- fenced-code exclusion;
- per-note resolved/unresolved/ambiguous diagnostics;
- explicit missing/existing-note recovery surfaces;
- backlinks and Graph remain derived from Markdown.

### Out

- no persistent backlink database;
- no hidden note IDs in Markdown;
- no AI/semantic auto-linking;
- no block references or transclusion;
- no Graph redesign;
- no provider content access;
- no black-box/live-browser milestone.

## Verification / Evidence

- Deterministic note-link tests cover aliases, unique/missing/ambiguous resolution, fenced code, rename rewriting, alias preservation, token replacement, backlinks, and diagnostics.
- Workspace reducer tests cover atomic title/link integrity and tab alignment.
- Existing WorkspaceApp, Graph, persistence, retrieval, migration, portable-export, provider-adapter, vault, and landing gates remain required.
- PR gate: frozen install → lint → strict typecheck → deterministic tests → WXT ZIP → landing frozen install → Astro build.

## Blockers / Risks

- No known product blocker.
- Title-based links remain intentionally human-readable; duplicate titles remain visibly ambiguous rather than guessed.

## Next Action

Integrate M13 after the final repository gate is green, then execute M14.
