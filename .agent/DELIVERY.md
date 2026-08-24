# Delivery Plan

## Delivery philosophy

Ship vertical slices that prove the architecture in real use. Do not build graph intelligence, Obsidian bridge, multi-provider abstractions, or sync before the workspace shell is stable and useful.

Each iteration below should end in a coherent, manually usable state.

---

## Iteration 0 — Repository bootstrap

### Goal
Create a reproducible browser-extension development environment with fast verification.

### Deliverables
- WXT + React + TypeScript project
- package manager + lockfile
- strict TypeScript config
- lint/format configuration
- Vitest test runner
- build scripts
- Chromium unpacked-extension development flow
- minimal CI
- extension mounts a harmless isolated root on explicitly supported host pages

### Acceptance
- clean install works from README
- focused dev command starts extension workflow
- test command demonstrates a real passing bootstrap test
- typecheck/lint/build pass
- extension can be loaded unpacked in Chromium
- disabling/removing extension leaves host page untouched

### Non-scope
No workspace UX beyond a small development marker/toggle.

---

## Iteration 1 — Safe shell + compatibility health

### Goal
Prove Chatspace can coexist with the host application safely.

### Deliverables
- extension mount/unmount lifecycle
- Shadow DOM or equivalent style-isolated root
- top-level error boundary
- provider page detection
- compatibility state model
- duplicate-mount prevention across SPA navigation
- local sanitized host fixtures + contract tests
- hide/disable Chatspace action

### Acceptance
- one Chatspace root after repeated route changes
- no leaked observers/listeners after unmount
- unsupported fixture becomes `unsupported/degraded`, not crash
- host fixture remains interactive
- normal live host remains usable during manual check

---

## Iteration 2 — Three-panel workspace frame

### Goal
Deliver the core spatial interaction model.

### Deliverables
- left / center / right layout
- resizable panel boundaries
- collapse/restore left and center auxiliary surfaces as decided by final UX
- persisted panel dimensions
- reset layout command
- keyboard focus transitions
- narrow-width graceful degradation

### Acceptance
- resize persists across reload
- impossible widths are normalized
- keyboard can reach each workspace region
- center takes remaining width
- layout cannot make host conversation permanently inaccessible

---

## Iteration 3 — Local workspace tree

### Goal
Make hierarchical organization independently useful.

### Deliverables
- workspace entity
- nested folders
- create/rename/move/delete folder behavior
- local chat-reference entity created only through supported explicit action
- pins
- persistence + schema versioning
- tree keyboard navigation

### Acceptance
- nested folder behavior covered by domain tests
- reordering/moving cannot create cycles
- deleting folder has defined child behavior
- state restores after reload
- malformed stored data surfaces recovery error rather than silent loss

---

## Iteration 4 — Tabs + command palette

### Goal
Make context switching materially faster than the base feed interface.

### Deliverables
- local workspace tabs
- open/close/activate/reorder
- optional pin behavior if proven useful
- command registry
- command palette
- shared commands between UI and keyboard
- persisted active workspace state

### Acceptance
- no separate business logic for button vs keyboard actions
- closed tab behavior deterministic
- active tab restoration tested
- command palette is keyboard complete

---

## Iteration 5 — Provider navigation capability

### Goal
Connect local references to supported provider navigation without turning Chatspace into an undocumented client.

### Preconditions
- current provider terms/documentation rechecked
- exact navigation behavior judged policy-safe
- no automated extraction of data/output required

### Deliverables
- minimal provider target format
- explicit user action to create/reference a current conversation only if supported
- navigation adapter capability
- degraded state when navigation cannot be safely resolved
- compatibility diagnostics

### Acceptance
- provider-specific data remains inside adapter boundary
- no session/auth material persisted
- no private API usage
- unavailable capability disables only dependent action
- local workspace remains functional when provider navigation is degraded

---

## Iteration 6 — Local notes

### Goal
Let Chatspace hold durable user-authored knowledge without yet becoming an Obsidian clone.

### Deliverables
- local Markdown note entity
- create/edit/rename/delete
- note tab/view
- links between local note and local chat references
- safe Markdown rendering
- local export of Chatspace-owned notes/data

### Acceptance
- no executable Markdown/unsafe HTML by default
- note persistence/migrations tested
- links survive rename through stable IDs
- export round-trip strategy defined/tested

---

## Iteration 7 — Graph as navigation

### Goal
Represent local workspace relationships spatially.

### Deliverables
- pure `GraphProjector`
- folder/chat-reference/note nodes from permitted local state
- typed/provenanced edges
- interactive renderer
- search/focus
- selection details/actions
- graph opens relevant local entity/navigation command

### Acceptance
- graph is projection, not second source of truth
- every edge has provenance
- graph remains usable at defined scale
- selected node has non-hover interaction path
- graph rendering code does not import provider DOM adapter

### Explicit non-goal
No automatic semantic extraction of live ChatGPT output.

---

## Iteration 8 — Reliability + store readiness

### Goal
Make daily use and distribution safe.

### Deliverables
- manifest permission audit
- privacy disclosure
- robust storage reset/export
- migration failure recovery
- compatibility diagnostics UI
- release packaging
- GitHub release workflow
- Chrome/Edge store assets/process if publishing is desired
- release checklist

### Acceptance
- full verification suite passes
- manual live compatibility checklist recorded
- permissions match implemented features only
- no debug logging of private content
- install/update/uninstall lifecycle tested

---

## Iteration 9 — Obsidian/local filesystem bridge (conditional)

### Gate
Only build after local notes/workspaces show clear value and users need shared filesystem Markdown.

### Required architecture first
- separate threat model/design
- localhost pairing/auth
- vault root authorization
- path traversal protections
- atomic writes/version conflict model

### Deliverables
Potentially:
- companion process
- explicit vault selection
- Markdown read/write bridge
- backlinks/metadata mapping

Do not bundle this into the browser extension MVP.

---

## Iteration 10 — Provider-supported semantic enrichment (conditional)

### Gate
Only through a provider-supported path such as an official API/SDK/export or explicit permission compatible with intended behavior.

Potential capabilities:
- semantic outline
- concept extraction
- relationship suggestions
- cross-conversation graph enrichment
- summaries

Requirements:
- provenance on every derived entity
- user can distinguish local/manual vs AI-derived relationships
- derived data never becomes irreversible source of truth

---

# Delivery priority order

```text
0 Bootstrap
  ↓
1 Safe shell
  ↓
2 Spatial layout
  ↓
3 Local organization
  ↓
4 Fast navigation UX
  ↓
5 Supported provider navigation
  ↓
6 Durable local notes
  ↓
7 Local graph
  ↓
8 Reliability/distribution
  ↓
9+ Optional expansions based on evidence
```

Do not reorder graph/semantic features ahead of the workspace fundamentals because the core hypothesis is navigation, not AI extraction.

# Release milestones

### v0.1 Developer shell
Iterations 0–2.

### v0.2 Useful local workspace
Iterations 3–4.

### v0.3 Provider-aware workspace
Iteration 5 if supported.

### v0.4 Knowledge workspace
Iterations 6–7.

### v1.0 Daily-driver extension
Iteration 8 plus demonstrated stability from real usage.

# Iteration review

At the end of each iteration record in `STATE.md`:

- what behavior is actually working
- verification evidence
- user friction discovered
- architecture debt introduced intentionally
- compatibility state
- single next priority

Do not start the next milestone merely because the planned code exists; the previous flow must be usable and verified.
