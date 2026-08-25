# Delivery Plan

## Delivery philosophy

Ship vertical user outcomes, not a checklist of component names.

A feature is not complete merely because lint/typecheck/tests/build are green. Completion requires both:

```text
Engineering gate
lint + strict typecheck + tests + production build

             AND

Product acceptance
observable workflow behaves as intended
```

## Product-convergence correction

The first merged v1 proved domain/persistence foundations but exposed an acceptance failure: Chatspace rendered as a large fixed overlay with a fake provider panel, and the graph was a list/table rather than a spatial navigation surface.

The corrected architecture therefore prioritizes:

1. native ChatGPT remains unobscured
2. Chatspace lives in the browser Side Panel
3. Explorer + Workbench are extension-owned
4. content script is URL-only provider bridge
5. graph must be spatial
6. layout behavior must be persisted and tested as a user outcome

## Current core slices

### Slice A — Side-panel composition

Acceptance:

- extension action opens Chatspace side panel
- content script renders no Chatspace UI
- no fake Provider panel
- native ChatGPT remains the main-page conversation surface

### Slice B — Explorer

Acceptance:

- search local workspace
- nested folders expand/collapse
- create note/folder
- basic folder rename/delete
- pin/unpin saved chats
- opening a saved chat navigates native ChatGPT via validated target

### Slice C — Layout

Acceptance:

- Explorer width is bounded and keyboard/pointer resizable
- width persists through canonical workspace layout state
- Explorer collapse persists
- narrow width does not create unusable permanent columns

### Slice D — Workbench

Acceptance:

- tabs switch local artifacts
- command palette supports keyboard selection/Enter/Escape
- note surface supports Markdown Edit/Preview, tags, linked chats
- provider status is status only, not a duplicate provider UI

### Slice E — Spatial graph

Acceptance:

- graph uses actual spatial node positions and visible edges
- zoom/reset controls work
- selection opens an inspector
- selected artifact can be opened
- edge provenance is visible
- graph stays a projection of canonical state
- placeholder notes do not create false semantic relationships

### Slice F — Reliability

Acceptance:

- extension-owned storage
- schema validation
- corrupt storage blocks unsafe overwrite
- import/export/reset available
- provider bridge failure does not break local workspace

## Quality gate order

```text
lint
 ↓
strict typecheck
 ↓
tests including product acceptance behavior
 ↓
production build
 ↓
manual live browser visual/use check when available
 ↓
merge
```

## Scope discipline

Do not add more integrations, semantic sophistication, multi-provider abstraction, or design-system inventory while the core Explorer/Workbench/navigation experience has an unresolved product-acceptance issue.

## Release distinction

- **development-ready:** code gates green and core flows implemented
- **daily-driver candidate:** development-ready + repeated manual live use without major UX blocker
- **store-ready:** daily-driver candidate + reproducible lockfile/package, permission audit, packaging assets/process, and install/update lifecycle checks

Do not collapse these three states into one “done” label.
