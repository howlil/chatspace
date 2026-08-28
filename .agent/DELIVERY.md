# Delivery Plan

## Delivery philosophy

Ship vertical user outcomes, not a checklist of component names.

A change is complete when:

```text
Product acceptance
observable workflow behaves as intended

             AND

Risk-appropriate engineering confidence
the realistic failure modes are sufficiently verified
```

Do not equate “more checks” with “more quality”. Verification depth follows meaningful risk.

## Product-convergence correction

The first merged v1 proved domain/persistence foundations but exposed an acceptance failure: Chatspace rendered as a large fixed overlay with a fake provider panel, and the graph was a list/table rather than a spatial navigation surface.

The corrected architecture therefore prioritizes:

1. native ChatGPT remains unobscured
2. Chatspace lives in the browser Side Panel
3. Explorer + Workbench are extension-owned
4. provider integration is URL-only through the validated active-tab boundary
5. graph must be spatial
6. layout behavior is persisted as local workspace state

## Current core slices

### Slice A — Side-panel composition

Acceptance:

- extension action opens Chatspace side panel
- no Chatspace UI is injected into the provider page
- no fake Provider panel
- native ChatGPT remains the main-page conversation surface

### Slice B — Explorer

Acceptance:

- search local workspace
- nested folders expand/collapse
- create root folder/note
- intentional nesting is explicit
- folder/chat/note hierarchy can be moved reversibly
- invalid folder cycles are rejected
- pin/unpin saved chats
- opening a saved chat navigates native ChatGPT through a validated target

### Slice C — Layout/theme

Acceptance:

- Explorer width is bounded and resizable
- width/collapse persist through canonical workspace state
- narrow width remains usable
- light/dark preference persists
- semantic UI tokens work across primary surfaces

### Slice D — Workbench

Acceptance:

- tabs switch local artifacts
- command palette supports keyboard selection/Enter/Escape
- note surface supports Markdown Edit/Preview, tags, linked chats
- provider status is status only, not a duplicate provider UI

### Slice E — Spatial graph

Acceptance:

- graph uses spatial node positions and visible edges
- zoom/reset controls work
- selection opens an inspector
- selected artifact can be opened
- edge provenance is visible
- graph stays a projection of canonical state
- placeholder notes do not create false semantic relationships

### Slice F — Reliability

Acceptance:

- extension-owned canonical storage
- schema validation
- corrupt storage blocks unsafe overwrite
- import/export/reset available
- rapid persistence writes coalesce to the latest snapshot and physical writes are serialized
- provider failure does not break local workspace
- no obsolete provider content-script bridge is required

## Verification strategy

Use `.agent/TESTING.md` as the verification authority.

For each change:

```text
realistic failure
      ↓
impact + likelihood
      ↓
cheapest high-signal evidence
      ↓
broaden only when justified
      ↓
accept / merge
```

Examples:

- docs/copy-only: diff inspection may be sufficient
- styling/presentation-only: focused visual/manual check; do not add tests just for class changes
- deterministic domain/interaction regression: focused automated behavior test
- persistence/concurrency/data: stronger deterministic regression/boundary checks
- permissions/security/provider contract: explicit boundary/security verification
- release candidate: packaging/install/browser/permission checks appropriate to release risk

The repository may enforce a cheap baseline CI gate. Passing it does not replace product acceptance, and agents do not need to duplicate every CI check locally unless the affected risk requires it.

Do not run the complete manual browser checklist for unrelated low-risk work.

## Scope discipline

Do not add more integrations, semantic sophistication, multi-provider abstraction, or design-system inventory without an approved product requirement.

When current functionality is sufficient, use real daily-driver friction to decide the next product change rather than generating scope from best practices.

## Release distinction

- **development-ready:** accepted change + sufficient risk-based confidence
- **daily-driver candidate:** development-ready + repeated manual live use without major UX blocker
- **store-ready:** daily-driver candidate + reproducible install/package, permission/privacy audit, packaging assets/process, and install/update lifecycle checks

Do not collapse these states into one “done” label.

Release-specific verification is intentionally broader than ordinary change verification.
