# Current Iteration

Status: **READY_FOR_MILESTONE**

## Feature Compass

**Shape:** Chatspace now supports a coherent local knowledge workflow from capture and organization through Markdown curation, links/Graph, lightweight structured properties and saved views, explicit Markdown round trip, and portable local export while native ChatGPT remains the provider-owned conversation runtime.

**Position:** M16 — Structured Knowledge is complete. There is no active milestone, slice, logical change, or task.

**Delta:** M16 added typed note properties (`text`, `number`, `boolean`, `tags`, `date`), compact property editing, named AND-only saved views, saved-view Quick Open/tabs/projection, the built-in `Learning Note` template, deterministic schema v1/v2 -> v3 migration, and structured-property Markdown round trip.

**Next Move:** Select the next milestone only from a meaningful gap in the core user journey/capability map. Do not create a milestone merely to keep implementation moving.

## Canonical active-work decomposition

```text
Product purpose: durable local knowledge around native ChatGPT
Core journey: capture/resume -> organize -> curate -> connect/structure -> retrieve -> return/export
Capability gap: not selected
Milestone: none active
Slice: none active
Logical change: none active
Task: none active
```

When a new milestone is selected, this file should track only the active integrated outcome and enough state to resume work. Do not turn it into a persistent backlog or sprint diary.

## Last completed milestone — M16 Structured Knowledge

### Product outcome

Users can attach small typed properties to canonical local notes, project notes through named saved filters, and create a bounded learning-note structure without turning Chatspace into a database/workflow platform.

### Completed vertical behavior

- canonical workspace migrated to schema v3;
- local notes carry typed lightweight properties;
- note context supports compact property add/edit/remove;
- named saved views persist AND-only equality filters rather than copied note results;
- saved views are accessible through Quick Open, tabs, and projection UI;
- deleting a saved view does not delete canonical notes;
- built-in `Learning Note` template supports only `{{title}}` and `{{date}}`;
- supported portable Markdown round trip preserves structured properties;
- malformed unsupported structured property shapes are rejected instead of silently dropped.

### Deliberate boundaries

- no custom property-schema registry;
- no table/database, board/Kanban, calendar, gallery, or timeline product;
- no formulas, rollups, computed fields, or typed database relations;
- no automation, reminders, task manager, or AI classification;
- no provider conversation/content extraction;
- no continuous filesystem sync.

## Verification evidence

M16 evidence at completion:

- deterministic migration coverage for schema v1/v2 -> v3 preserving existing workspace state;
- structured-knowledge domain coverage for property types, equality semantics, AND filtering, saved-view definitions, derived property values, and template variables;
- reducer coverage for saved-view persistence/tab cleanup without note mutation;
- Markdown import/export coverage for structured-property preservation and invalid-property rejection;
- deterministic UI coverage for property editing, Learning Note creation, and saved-view projection without copied notes;
- repository gate passed lint, strict typecheck, 109 deterministic tests, extension ZIP build, frozen landing install, and Astro build.

## Known risks / boundaries for future work

- No known product blocker is active.
- Any future workspace-schema change is a material persisted-contract change.
- Richer query operators, custom templates, database-style views, property-schema expansion, or automation are new product behavior and require an explicit milestone outcome rather than incremental scope creep.
- Browser-environment behavior still requires live-browser evidence where deterministic repository tests cannot establish it.

## Next milestone selection rule

Before proposing M17:

1. reconstruct the core user journey and identify the highest-value unresolved friction/failure;
2. map it to the capability map in `PROJECT.md`;
3. confirm the outcome is core product value rather than a nice-to-have, isolated technical enabler, or cosmetic cleanup;
4. define one integrated milestone outcome end-to-end;
5. decompose that milestone into demonstrable vertical slices only after the milestone boundary is coherent.

If no such core gap is established, remain `READY_FOR_MILESTONE` rather than manufacturing work.
