# Delivery & Release Readiness

`AGENTS.md` owns the canonical development lifecycle. This file stores Chatspace-specific delivery/readiness context and must not redefine that lifecycle.

## 1. Delivery philosophy

Ship the smallest complete user outcome, not a checklist of component names.

A change is development-complete when:

```text
approved observable acceptance
AND
risk-appropriate engineering confidence
AND
repository-required quality gates
```

Do not equate more checks with more quality. Verification depth follows meaningful risk; required merge gates remain required.

## 2. Product-convergence history

The first merged v1 proved domain/persistence foundations but exposed an acceptance failure: Chatspace rendered as a large fixed overlay with a fake provider panel, and the graph was a list/table rather than a spatial navigation surface.

The corrected product/architecture therefore preserves these durable constraints:

1. native ChatGPT remains unobscured
2. Chatspace lives in the browser Side Panel
3. Explorer + Workbench are extension-owned
4. provider integration is URL-only through the validated active-tab `browser.tabs` boundary
5. graph is spatial
6. restorable layout behavior is local workspace state

This historical convergence is project knowledge, not an instruction to re-audit these decisions for every task.

## 3. Current delivered capability slices

### Side-panel composition

- extension action opens Chatspace Side Panel
- no Chatspace workspace UI is injected into the provider page
- no fake provider panel
- native ChatGPT remains the conversation surface

### Explorer

- search local workspace
- nested folders expand/collapse
- root and intentional-subfolder creation have explicit semantics
- folder/chat/note hierarchy can move reversibly
- invalid folder cycles are rejected
- saved chats can be pinned and resumed through validated targets

### Layout / theme

- Explorer width/collapse are bounded and persisted
- narrow layout remains usable
- light/dark preference persists
- semantic UI tokens cover primary surfaces

### Workbench

- tabs switch local artifacts
- command palette exposes shared local actions
- note surface supports Markdown edit/preview, tags, linked chats, related-local navigation
- provider status remains status only

### Spatial graph

- spatial node positions and visible edges
- selection/inspector/open flow
- provenance is visible
- graph remains a projection of canonical state
- placeholder notes do not create false local-semantic relations

### Reliability

- extension-owned canonical storage
- schema validation and corruption fail-closed behavior
- import/export/reset/recovery
- coalesced/serialized production persistence writes
- provider failure does not break local workspace
- no obsolete provider content script is required

These describe current delivered product knowledge. They are not a mandatory checklist for unrelated changes.

## 4. Verification strategy

`.agent/TESTING.md` is the detailed verification authority.

For a change:

```text
realistic failure
-> impact + likelihood
-> cheapest high-signal evidence
-> broaden only when required
-> satisfy repository quality gates
```

Examples only:

- docs/copy-only: diff inspection may be sufficient local evidence
- styling/presentation-only: focused visual/manual check where useful
- deterministic domain/interaction regression: focused automated behavior test
- persistence/concurrency/data: stronger deterministic boundary/regression checks
- permissions/security/provider contract: focused boundary/security verification
- actual release candidate: package/install/browser/permission checks appropriate to release risk

Do not run the complete manual browser checklist for unrelated low-risk work.

## 5. Scope discipline

Do not add more integrations, semantic sophistication, multi-provider abstraction, synchronization, or design-system inventory without an approved product requirement.

Real usage/friction may be evidence for a future product decision, but it does not authorize implementation by itself.

## 6. Release readiness

Keep these states distinct:

- **development-ready**: approved change + sufficient risk-based evidence + required merge gates
- **release-ready increment**: smallest complete accepted increment that can remain safely on releasable `master`
- **daily-driver candidate**: release-ready product state suitable for repeated real use, with environment-specific acceptance performed where required
- **store-ready**: daily-driver confidence + reproducible install/package + permission/privacy/distribution/install/update lifecycle requirements

Do not collapse these into one generic “done”.

Release-specific verification is broader only when actually preparing a distribution candidate or when the changed risk itself requires it.

## 7. Instrumentation decision

Before an actual release intended to test a product outcome, ask:

```text
Expected product outcome:
Can existing/manual evidence evaluate it?
Would missing evidence block the product decision?
What is the minimum additional signal required?
```

Instrumentation is optional, not a mandatory release ceremony.

Do not add analytics merely because a metric exists in `PRODUCT.md`. Any remote telemetry requires explicit product/privacy consideration and must not contain provider conversation content.

## 8. Post-release product learning

When a released change is being evaluated, use the product-learning loop defined in `AGENTS.md` / `PRODUCT.md`:

```text
RELEASE
-> OBSERVE relevant signals
-> EVIDENCE
-> KEEP / ITERATE / REVERT / REMOVE / INVESTIGATE recommendation
-> USER DECISION
```

Observe only what matters to the expected outcome, potentially:

- technical health
- user behavior/friction
- product outcome

A recommendation does not authorize another product iteration. The user establishes the next requirement.

## 9. Current release constraint

Chatspace is a daily-driver candidate, not yet a public/store-ready release.

Current known release-readiness work is operational rather than new product scope:

- reproducible dependency install/committed lockfile
- bounded live-browser acceptance of the current daily-driver journey

Do not add unrelated product features while completing these readiness items.
