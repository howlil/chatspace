# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Make note-to-note knowledge navigation a natural part of writing without introducing another persisted relationship source of truth.

Why: Chatspace already had Markdown notes, manual Graph relations, and locally derived similarity. M11 adds one coherent writing-to-navigation use case: write `[[Title]]` → resolve locally → follow outgoing links/backlinks → see the same explicit relation in Graph.

## Feature Compass

**Shape:** Local notes use `[[Title]]` as the canonical explicit note-link syntax. The editor offers local title completion, Preview opens uniquely resolved links, the note context exposes outgoing links and backlinks, and Graph projects those links with `derived-link` provenance. Missing or duplicate titles are surfaced as unresolved/ambiguous instead of guessed.

**Position:** M11 — Linked Notes & Backlinks is complete and ready to integrate.

**Delta:** Added deterministic wikilink parsing/resolution, backlinks, editor completion, safe Preview navigation, link-aware note context, and Graph note-link projection. Explicit links take precedence over generic related-local similarity, while manual graph relations retain highest precedence for the same pair.

**Next Move:** Execute the already-approved M12 — Portable Knowledge milestone: export the user-owned local workspace as understandable Markdown hierarchy + metadata + manifest + workspace backup through direct File System Access, without exporting native ChatGPT conversation content.

## Scope

### In

- canonical `[[Title]]` note links stored directly in Markdown content;
- deterministic parsing that ignores fenced code blocks;
- exact normalized-title resolution;
- fail-closed ambiguous and unresolved link states;
- editor title completion while writing a wikilink;
- clickable uniquely resolved links in safe Markdown Preview;
- outgoing links and backlinks derived from active local notes;
- Graph `note-link` edges with `derived-link` provenance;
- precedence: manual relation > explicit note link > locally derived similarity for the same note pair.

### Out

- no persisted backlink array or second relationship database;
- no ID-based hidden wikilink syntax;
- no automatic link creation, AI linking, semantic indexing, or provider-content extraction;
- no title-rename rewrite framework in this milestone;
- no archived-note linking surface;
- no black-box/live-browser milestone.

## Slices

- [x] **Slice 1 — Link model:** parse `[[Title]]`, resolve unique titles, and derive outgoing/backlink relationships deterministically.
- [x] **Slice 2 — Writing flow:** add note-title completion and safe Preview navigation while keeping Markdown canonical.
- [x] **Slice 3 — Knowledge navigation:** expose links/backlinks in note context and project explicit note links into Graph with provenance/precedence.
- [x] **Slice 4 — Milestone gate:** wire active-note catalogs through WorkspaceApp and pass the full deterministic repository gate.

## Current Decisions

- `[[Title]]` is the only canonical note-link syntax introduced by M11; links remain user-readable Markdown.
- A normalized title resolves only when exactly one active note matches. Zero matches are unresolved; multiple matches are ambiguous.
- Link relationships and backlinks are projections of Markdown, not persisted workspace fields, so M11 does not change `WorkspaceSnapshot` schema v2.
- Archived notes are excluded from active link resolution/navigation and Graph projection until restored.
- For a note pair, manual Graph relation wins over explicit Markdown link; explicit Markdown link wins over related-local similarity.
- Safe Preview still renders React content rather than raw HTML injection.

## Verification / Evidence

- Deterministic note-link tests cover parsing, fenced-code exclusion, unique/missing/ambiguous resolution, outgoing links, backlinks, and active wikilink queries.
- LocalNoteEditor tests cover safe Markdown rendering and navigation through a uniquely resolved `[[Title]]` link.
- Graph tests cover explicit note-link projection and relationship precedence.
- Existing workspace, migration, bulk triage, retrieval, Graph, persistence, provider-adapter, settings, command-palette, and local-vault suites remain part of the gate.
- PR CI #241 passed frozen install, lint, strict typecheck, deterministic tests, WXT ZIP packaging, landing frozen install, and Astro static build.

## Blockers / Risks

- No known repository or product blocker.
- Title-based links intentionally expose ambiguity when duplicate note titles exist; do not silently select one target.
- Renaming a target note can make existing title-based links unresolved; automatic rewrite remains out of scope unless explicitly requested.

## Next Action

Integrate M11 after this documentation-only closure commit passes CI, then execute M12 from fresh `master`.
