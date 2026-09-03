# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Make Chatspace-owned knowledge portable as understandable files without expanding provider access or introducing another persisted source of truth.

Why: JSON backup preserves the canonical application state, but it is not the best human-readable handoff format. M12 adds one coherent portability use case: choose a folder → export local notes and hierarchy as Markdown → retain local chat-reference metadata and explicit relationships → keep a canonical JSON backup alongside a manifest.

## Feature Compass

**Shape:** Settings now exposes an explicit Portable knowledge export. Chatspace projects `WorkspaceSnapshot` v2 into a user-selected folder containing Markdown notes in their local hierarchy, Markdown files for saved ChatGPT reference metadata, relationship metadata, `manifest.json`, and the canonical `workspace.json` backup. Native ChatGPT conversation content is never part of the projection.

**Position:** M12 — Portable Knowledge is complete and ready to integrate.

**Delta:** Added a deterministic portable-export projection, path-safe human-readable folder/file naming, Markdown frontmatter, relationship/manifest metadata, direct File System Access writing, cancellation handling, and Settings UI. The export includes active and archived Chatspace-owned artifacts while retaining their lifecycle metadata.

**Next Move:** Wait for an explicit next product/engineering outcome. Do not invent another milestone and do not create a black-box/live-browser milestone.

## Scope

### In

- deterministic projection from canonical `WorkspaceSnapshot` v2;
- human-readable folder hierarchy with stable IDs in directory/file names to avoid collisions;
- note Markdown files preserving user-authored Markdown plus explicit frontmatter metadata;
- saved ChatGPT reference Markdown containing only Chatspace-owned metadata and validated target URLs;
- `relationships.json` for linked chats, derived active `[[Title]]` note links, and canonical manual graph edges;
- `manifest.json` with format/version, workspace metadata, counts, folder mapping, file layout, and explicit provider-content boundary;
- `workspace.json` as the canonical machine-readable backup inside the portable bundle;
- active and archived local artifacts included with `archived_at` metadata;
- direct user-selected folder export through File System Access;
- user cancellation treated as a no-op rather than an error.

### Out

- no native ChatGPT conversation body/output export;
- no provider DOM/content access, history crawling, private API access, cookie/session access, or network interception;
- no new `WorkspaceSnapshot` field or schema-version change;
- no persisted portable-export directory handle;
- no automatic, scheduled, background, or bidirectional export/sync;
- no ZIP/archive dependency or remote storage target;
- no portable-bundle import format in this milestone;
- no black-box/live-browser milestone.

## Slices

- [x] **Slice 1 — Portable projection:** produce deterministic Markdown, manifest, relationship metadata, and canonical JSON backup from `WorkspaceSnapshot` v2.
- [x] **Slice 2 — Direct folder writer:** write the projected bundle beneath one explicit export root using File System Access without persisting the chosen destination.
- [x] **Slice 3 — Settings flow:** expose one explicit Portable knowledge action with capability/error/success feedback and clear provider-content boundaries.
- [x] **Slice 4 — Milestone gate:** add deterministic projection/writer/UI tests, fix lint feedback, and pass the full repository verification ladder.

## Current Decisions

- Portable export is a projection only. `WorkspaceSnapshot` v2 remains the single canonical persisted workspace contract.
- The bundle format is `chatspace-portable-knowledge`, version 1; this version is an export-format version, not a workspace-schema version.
- Human-readable names are combined with stable local IDs so duplicate titles/folder names do not collide on disk.
- Notes preserve original Markdown content after frontmatter. `[[Title]]` syntax remains readable and unchanged in exported note bodies.
- Saved chat-reference files contain provider name, local label, validated target URL, local folder/pin/archive/timestamp metadata only. They never contain provider conversation content.
- `relationships.json` carries explicit metadata useful outside the application while `workspace.json` remains the lossless Chatspace backup.
- Archived notes/chat references are included because portability should cover user-owned local data, but their archived lifecycle state remains explicit.
- The selected export folder is session-local to the user action and is not persisted in `WorkspaceSnapshot` or integration storage.

## Verification / Evidence

- Portable projection tests cover nested hierarchy, note/chat frontmatter, linked chats, derived note links, manual relationships, archived artifacts, provider-content boundary metadata, and path sanitization.
- Direct-folder writer tests use deterministic in-memory File System Access-shaped handles and cover root/file creation, injected picker behavior, and cancellation.
- Settings tests cover explicit portable-export invocation and success feedback while retaining import/reset/recovery coverage.
- Existing workspace, migration, bulk triage, retrieval, linked-note, Graph, persistence, provider-adapter, command-palette, local-vault, and landing suites remain part of the gate.
- PR CI #246 passed lint, strict typecheck, deterministic tests, WXT ZIP packaging, landing frozen install, and Astro static build after the initial lint issue was corrected.

## Blockers / Risks

- No known repository or product blocker.
- Direct folder export depends on browser File System Access support; unsupported contexts disable the action and surface that limitation.
- Portable export is intentionally one-way. Restoring canonical Chatspace state still uses the existing schema-valid JSON backup/import path.

## Next Action

Integrate M12 after this documentation-only closure commit passes CI. After merge, verify `master` CI and stop.
