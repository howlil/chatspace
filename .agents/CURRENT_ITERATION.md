# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Let users safely bring existing Markdown knowledge into Chatspace and export it back without introducing live filesystem sync or a second source of truth.

## Feature Compass

**Shape:** Settings now exposes one explicit Markdown round-trip surface. Import follows `Choose folder → read-only scan → review counts/conflicts → explicit resolution → one canonical workspace replacement`. Export continues to project Chatspace-owned knowledge into understandable Markdown through the existing portable export. Folder hierarchy, body Markdown, tags, wikilinks, and Chatspace note IDs are recognized.

**Position:** M15 — Markdown Import & Round-trip Knowledge is implementation-complete and awaiting the final repository gate.

**Delta:** Added a deterministic Markdown scanner/parser, recursive read-only folder integration, preview metrics for notes/folders/resolved and unresolved links/conflicts, explicit ID/title conflict actions, stale-scan protection, and one coherent import transition. Existing notes are never silently overwritten or auto-merged.

**Next Move:** Integrate M15 after the full deterministic gate is green, then execute the already-approved M16 — Structured Knowledge milestone from fresh `master`.

## Scope

### In

- `Settings → Import Markdown folder → Choose folder → Scan → Review → Import`;
- recursive `.md` folder scanning through File System Access in read-only mode;
- scan and preview before any workspace mutation;
- folder hierarchy mapping;
- Markdown body preservation;
- YAML frontmatter support for `title`, `tags`, `chatspace_id`, and exported `chatspace_type`;
- wikilink parsing and resolved/unresolved preview counts;
- prior Chatspace export note IDs recognized;
- explicit conflict resolution:
  - ID match: `Update existing / Keep existing / Duplicate`;
  - title collision: `Keep existing / Import as duplicate / Rename incoming / Skip`;
- stale scan rejection when workspace state changed after review;
- one final canonical workspace replacement through the existing validated JSON import path;
- existing portable Markdown export remains the explicit export half of the round-trip.

### Out

- no continuous folder watching;
- no automatic or bidirectional filesystem sync;
- no silent overwrite or automatic Markdown merge;
- no git, Dropbox, Drive, Notion API, HTML/PDF import, or full Obsidian compatibility;
- no provider conversation import or provider DOM/content access;
- no new workspace schema version;
- no black-box/live-browser milestone.

## Verification / Evidence

- domain tests cover YAML/frontmatter parsing, folder hierarchy, tags, body, wikilinks, Chatspace IDs, exported path recognition, conflicts, explicit decisions, atomic application, inbound-link-safe ID updates, and stale-scan rejection;
- browser integration tests cover recursive Markdown-only read scanning and picker cancellation;
- Settings tests cover the read-only preview-before-mutation flow and canonical import handoff;
- the existing persistence, migration, note-link, Graph, capture Inbox, retrieval, portable export, local-vault, provider adapter, extension package, and landing build remain in the full repository gate.

## Blockers / Risks

- No known product blocker.
- Browser folder import depends on File System Access support; unsupported contexts disable the action and surface that limitation.
- The YAML parser intentionally supports the small top-level metadata subset required by this milestone rather than full YAML/Obsidian semantics.

## Next Action

Run the full M15 repository gate, integrate when green, then execute M16.