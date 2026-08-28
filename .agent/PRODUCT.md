# Product Strategy

This file stores durable Chatspace product knowledge. `AGENTS.md` owns the execution lifecycle and product-authority rules.

Product knowledge here is not permission for an agent to invent new feature scope. New product behavior still requires explicit user authority.

## 1. Problem

Long AI conversations are useful but weak as an ongoing workspace. Users need to return to prior contexts, organize many conversations, curate durable notes, and navigate relationships without replacing the provider experience they already value.

## 2. Product thesis

```text
AI provider = intelligence + provider-owned conversation behavior
Chatspace    = workspace + organization + spatial navigation + local knowledge
```

Chatspace is not an alternative ChatGPT client.

## 3. Product authority and requirement interpretation

For a new product change, keep these distinct:

```text
Problem           = user/product need
Proposed solution = one possible way to solve it
Explicit requirement = approved behavior to implement
Expected outcome  = what should improve if the requirement works
```

Do not treat an existing proposed solution, metric, friction observation, or best-practice idea as an approved requirement.

The agent may surface evidence, risks, and implementation alternatives. The user owns final product semantics, scope, material architecture, and product decisions.

## 4. Target experience

The browser supplies the final composition:

```text
┌──────────────────── Chatspace Side Panel ────────────────────┬── ChatGPT ──────────┐
│ Explorer                    Workbench                        │ native conversation │
│ search                      tabs                             │ messages            │
│ pinned                      note / graph / settings          │ composer            │
│ folders                                                     │ tools               │
│ chat references                                             │                     │
└──────────────────────────────────────────────────────────────┴─────────────────────┘
```

The right-hand conversation is native ChatGPT in the main browser page, not a React panel recreated by Chatspace.

The side panel should feel closer to a compact editor than a dashboard.

## 5. Core entities

### Workspace
Local organizational boundary for folders, chat references, tabs, notes, layout, and graph relationships.

### Chat reference
Minimum local metadata required to return to a supported provider conversation target.

### Folder
Nested local organization independent from provider projects.

### Tab
Restorable workbench context such as Home, note, graph, settings, or a saved chat reference.

### Note
User-owned Markdown knowledge with explicit tags and links to saved chat references.

### Graph
A spatial projection over canonical local state with explicit provenance.

### Provider boundary
A narrow URL/tab boundary for current provider-state detection and validated explicit navigation. It is not a data extraction layer.

## 6. Core daily-driver flow

1. Open ChatGPT normally.
2. Open Chatspace in the browser Side Panel.
3. Save the current supported conversation as a URL-only reference when useful.
4. Organize references and notes in nested folders; pin important chats.
5. Switch workspace contexts through Home/tabs/Explorer/command palette.
6. Clicking a saved chat navigates native ChatGPT to the validated conversation target.
7. Curate durable learning/knowledge into Markdown notes.
8. Use the graph to navigate local relationships spatially.

## 7. Current product acceptance

The core product is successful only if it materially reduces navigation/organization friction while preserving provider usability.

Approved behaviors include:

- Chatspace never covers or replaces native ChatGPT
- Explorer is searchable, collapsible, resizable, and persisted
- nested folders expose explicit predictable management semantics
- pinned/saved chat references are easy to return to
- saved chats navigate native ChatGPT through validated URLs only
- command palette is keyboard-operable
- notes support edit/preview and explicit local metadata
- graph is a spatial canvas, not a debug list/table
- every graph relationship has provenance
- local data survives restart and corruption fails closed/recoverably

Acceptance for a specific change should be derived only from its approved requirement, not from the entire product acceptance list.

## 8. Explicit non-goals

- private ChatGPT API client
- history crawling or automated conversation import
- automated extraction of ChatGPT output
- provider account/token handling
- cross-device sync
- provider-DOM semantic indexing
- opaque AI-generated graph edges
- mobile support in the current desktop-first product

These non-goals remain product boundaries until explicitly changed.

## 9. Product outcome and evidence

Potential product signals already identified for Chatspace include:

Primary:

- time-to-return-to-context
- navigation actions per context switch
- reuse of pinned/folder/tab/search primitives
- retained local workspaces

Reliability:

- provider page remains usable when Chatspace fails
- storage corruption/data-loss rate
- local interaction latency
- compatibility/navigation failure rate

Delivery:

- user-observable acceptance before iteration completion
- escaped defects
- CI reliability
- PR lead time

These are **candidate signals**, not a mandate to instrument every metric.

For an approved product change, first state the expected outcome. Before release, decide whether any instrumentation/evidence collection is actually necessary to evaluate it. Prefer existing observable evidence and real usage before adding telemetry.

Remote analytics/telemetry is not implied by this section and remains subject to product/privacy approval.

## 10. Product-learning loop

After a released change, when the user is evaluating whether it achieved its product outcome:

```text
expected outcome
-> observe relevant technical health / behavior / product outcome
-> compare evidence against expectation
-> recommend KEEP / ITERATE / REVERT / REMOVE / INVESTIGATE
-> user makes final product decision
```

Do not automatically start another implementation iteration from an observation. A new product change begins only after user authority establishes the next requirement.

## 11. Product principles

1. Preserve what already works: native provider conversation UX.
2. Navigation beats decoration.
3. Local data stays understandable and exportable.
4. Keyboard and mouse are peers.
5. Dense, not cluttered.
6. Provider failure degrades only provider-dependent behavior.
7. Compliance is architecture.
8. Product acceptance is observable user behavior, not a green test suite alone.
9. Evidence informs product decisions; it does not authorize scope by itself.
