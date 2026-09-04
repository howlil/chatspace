# Current Iteration

Status: **VERIFYING**

## Feature Compass

**Shape:** Chatspace is a local-first companion beside native ChatGPT. The primary loop remains save -> remember -> continue/find -> resume, with explicit distillation into user-authored local knowledge.

**Position:** M19 is merged into `master`. M20 — Focused Navigation & Command Surface Consolidation is implemented on `m20-focused-navigation-command-surface` and awaiting full repository verification.

**Delta:** M20 removes duplicate permanent navigation/action surfaces without removing capability. The Library is now owned by the left sidebar rather than duplicated as a top-level destination; collapse lives in the Library header; reopen appears at the leading edge only while collapsed; Library creation is consolidated behind one `+` menu; Save/Distill remain current-conversation actions plus Quick Open accelerators; Settings/More are utilities after tabs; and the Library root no longer reuses Home semantics.

**Next Move:** Run relevant deterministic CI, fix only evidence-backed failures, then move to `READY_FOR_MERGE`. Do not expand M20 into Graph, semantic search, new PKM capability, schema changes, or a broad visual redesign.

## Milestone decomposition

```text
Product purpose: durable local context and user-owned knowledge around native ChatGPT
Core journey: current context -> save -> remember -> continue/find -> resume -> distill -> own
Milestone: M20 — Focused Navigation & Command Surface Consolidation

Slice 1 — Canonical navigation model
  IMPLEMENTED
  Home remains primary daily context
  Library is the sidebar, not a duplicated top-nav destination
  Settings / More are secondary workspace utilities

Slice 2 — Sidebar ownership + collapse behavior
  IMPLEMENTED
  Collapse control lives in Library header
  Open-library control appears only while collapsed
  Existing persisted tree width / layout state remains authoritative

Slice 3 — Library header consolidation
  IMPLEMENTED
  one compact + menu -> New note / New folder / Quick capture
  persistent Save-current-chat toolbar action removed from Library

Slice 4 — Remove navigation semantic duplication
  IMPLEMENTED
  Workspace-root Home icon/label replaced by All items + FolderTree semantics

Slice 5 — Action placement audit
  IMPLEMENTED
  current conversation owns visible Save / Distill
  Quick Open remains keyboard acceleration
  item-scoped actions remain in row/context menus

Slice 6 — Chrome density cleanup
  IMPLEMENTED
  leading controls = collapsed Library opener + Home
  tabs own central horizontal space
  Settings / More moved to trailing utility group
  provider status remains subtle

Slice 7 — Interaction consistency audit
  IMPLEMENTED WITH EXISTING CONTRACTS
  row primary actions, frequent pin toggle, secondary ... menu, and context-menu vocabulary preserved

Slice 8 — Integrated deterministic verification
  IN PROGRESS
  focused WorkbenchChrome + LibraryHeader tests added
  full lint / strict typecheck / deterministic test suite / package CI pending
```

## Product outcome

A user should be able to infer the interaction model without scanning repeated icons:

```text
Home = current / daily work
Library sidebar = browse and organize local data
Tabs = opened work
Library + = create local artifacts / quick capture
Ctrl/Cmd K = retrieve or accelerate commands
Settings = data / configuration
More = advanced surfaces
```

Expanded Library owns its collapse affordance. When collapsed, the opener appears at the leading edge of the workbench so the control stays spatially consistent with the panel it reveals.

## Explicit non-goals

- no schema or migration changes;
- no Graph redesign;
- no semantic/vector search;
- no new note editor;
- no new provider integration;
- no animation-heavy redesign;
- no new sidebar data model;
- no black-box/live-browser completion gate.

## Verification evidence

Pending PR CI. Focused deterministic coverage currently includes:

- Workbench chrome does not expose a duplicate Library primary destination while the Library is visible;
- collapsed workbench exposes the leading Open library control and calls the canonical layout toggle;
- Library header exposes one create menu for New note / New folder / Quick capture;
- Library collapse action is owned by the Library header.

## Completion rule

M20 completes when repository-owned deterministic evidence is green and the integrated UI has one clear canonical visual home for global navigation, current-conversation actions, Library creation, sidebar collapse/reopen, and artifact-scoped actions. Product Authority retains final merge/release decision.
