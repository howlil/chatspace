# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Make a larger local Chatspace workspace fast to triage and retrieve without adding provider-content access or AI search.

Why: The existing workspace was effective at capture and organization but required mostly one-item-at-a-time operations. M10 adds one coherent large-workspace use case: find → select → organize → archive → retrieve.

## Feature Compass

**Shape:** Explorer is now a local triage surface as well as a hierarchy. Notes and saved chat references can be filtered, searched, multi-selected, moved, pinned where applicable, archived/restored, or deleted in bulk. `Ctrl/⌘ K` is a universal local Quick Open for active notes, saved chats, folders, and commands.

**Position:** M10 — Workspace Triage & Retrieval is complete and ready to integrate.

**Delta:** Added schema-v2 archive lifecycle with automatic v1 migration, deterministic retrieval primitives, atomic bulk artifact transitions, compact Explorer filters/selection actions, archived retrieval, and universal Quick Open. Archived artifacts are excluded from normal Home/Quick Open/Graph projections until restored.

**Next Move:** Execute the already-approved M11 — Linked Notes & Backlinks milestone: `[[Title]]` Markdown links remain canonical; backlinks and Graph note-link relations are derived, with unresolved/ambiguous titles surfaced rather than guessed.

## Scope

### In

- `WorkspaceSnapshot` v2 with `archivedAt: number | null` on notes and saved chat references;
- deterministic v1 → v2 migration during storage load and JSON import;
- mixed note/chat multi-select and atomic bulk move/archive/restore/delete;
- bulk pin/unpin for selected saved chat references;
- Explorer filters for All, Notes, Chats, Pinned, Unfiled, and Archived;
- local note title/tag/Markdown search, saved-chat label search, and folder-name search;
- `Ctrl/⌘ K` Quick Open over active local artifacts plus explicit commands;
- archived-artifact exclusion from normal Home and Graph projections.

### Out

- no folder bulk selection or recursive folder lifecycle redesign;
- no trash/recycle-bin subsystem, undo framework, activity history, smart folders, or saved queries;
- no AI/embedding/semantic search;
- no provider conversation full-text search or provider DOM/content access;
- no black-box/live-browser milestone.

## Slices

- [x] **Slice 1 — Triage mode:** mixed note/chat multi-selection plus atomic bulk organize/pin/archive/delete actions.
- [x] **Slice 2 — Archive & retrieval:** reversible archive lifecycle, migration, compact filters, content/tag retrieval, and active-surface exclusion.
- [x] **Slice 3 — Universal Quick Open:** local notes/chats/folders and existing commands share deterministic keyboard retrieval.

## Current Decisions

- `WorkspaceSnapshot` schema is v2; valid v1 state migrates by adding `archivedAt: null` without changing local artifact identity.
- Archive is reversible and non-destructive; delete remains the explicit destructive action.
- The existing storage key remains unchanged so stored v1 workspaces can be read and migrated rather than orphaned.
- Archived artifacts keep folder ownership/content/metadata/relationships but are absent from normal active projections until restored.
- Folders are deliberately excluded from bulk selection because nested delete/move semantics have a different blast radius.
- Local retrieval never reads native ChatGPT conversation content.

## Verification / Evidence

- Deterministic migration tests cover valid v1 → v2 and malformed legacy payloads.
- Deterministic domain tests cover mixed bulk move, archive/restore preservation, and atomic delete cleanup.
- Retrieval tests cover archived filtering, unfiled retrieval, note title/tag/content search, and Quick Open ranking.
- Command-palette tests cover commands and artifact Quick Open through the same local search surface.
- Existing workspace, Graph, persistence, provider-adapter, settings, and local-vault test suites remain part of the repository gate.
- PR gate requires frozen install, lint, strict typecheck, deterministic tests, WXT ZIP packaging, landing frozen install, and Astro build.

## Blockers / Risks

- No known product blocker.
- Schema v2 is intentionally narrow; do not turn the migration into a generic migration framework unless a future schema change requires it.

## Next Action

Integrate M10 after the final deterministic repository gate is green, then execute M11 from fresh `master`.
