# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Add useful structure to local notes without turning Chatspace into a database, workflow suite, or second source of truth.

## Feature Compass

**Shape:** Local notes can now carry small typed properties, be projected through named AND-only saved views, and be created from the built-in `Learning Note` template. The canonical workspace is schema v3, older v1/v2 state migrates deterministically, and M15 Markdown round-trip preserves supported structured properties.

**Position:** M16 — Structured Knowledge is complete.

**Delta:** Added typed note properties (`text`, `number`, `boolean`, `tags`, `date`), compact property editing in note context, named saved views that persist filters rather than copied results, Quick Open support for views, a built-in Learning Note template with only `{{title}}` and `{{date}}`, schema v1/v2 → v3 migration, and structured-property portable Markdown import/export.

**Next Move:** Wait for an explicit next milestone outcome.

## Scope

### In

- workspace schema v3 with deterministic v1/v2 migration;
- typed local-note properties: text, number, boolean, tags, and date;
- compact property add/remove UI on the note context rail;
- property-aware local retrieval;
- saved views as named AND-only equality filters over canonical notes;
- saved-view Quick Open, tabs, projection surface, and deletion without deleting notes;
- built-in `Learning Note` template;
- template variables limited to `{{title}}` and `{{date}}`;
- structured properties preserved through portable Markdown frontmatter and M15 import;
- malformed unsupported structured property shapes rejected rather than silently dropped.

### Out

- no custom property-schema registry;
- no database/table, board/Kanban, calendar, gallery, or timeline views;
- no formulas, rollups, computed fields, or typed database relations;
- no automation, reminders, task manager, or AI classification;
- no provider conversation/content extraction;
- no continuous filesystem sync;
- no black-box/live-browser milestone.

## Verification / Evidence

- schema migration tests cover v1 and v2 → v3 while preserving local notes, chat archive state, tabs, and hierarchy;
- structured-knowledge domain tests cover property types, equality semantics, AND filtering, derived property values, saved-view definitions, and template variables;
- reducer tests cover saved-view persistence/tab cleanup without note mutation;
- Markdown import/export tests cover structured-property preservation and invalid property rejection;
- deterministic WorkspaceApp coverage verifies property editing, Learning Note creation, and saved-view projection without copying notes;
- Quick Open, tabs, existing workspace behavior, persistence, Graph, Capture Inbox, Markdown import, local vault, provider adapter, packaging, and landing remain under the repository gate;
- final implementation gate passed lint, strict typecheck, 109 deterministic tests, extension ZIP build, frozen landing install, and Astro build.

## Blockers / Risks

- No known product blocker.
- Schema v3 is intentionally narrow. Adding new property types, richer query operators, custom templates, database views, or automation changes product behavior and requires a later explicit milestone.

## Next Action

Wait for an explicit next milestone outcome.