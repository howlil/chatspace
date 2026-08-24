# Product Strategy

## 1. Problem

Long AI conversations are powerful but structurally weak for ongoing knowledge work. The dominant feed UI creates friction when users need to:

- return to an earlier branch of reasoning
- compare multiple conversations
- keep several contexts visible simultaneously
- organize chats hierarchically
- convert useful reasoning into durable notes
- navigate concepts rather than timestamps
- understand relationships across a long discussion

Chatspace addresses the **information architecture and interaction model**, not the intelligence model.

## 2. Product thesis

```text
AI provider = intelligence + provider-owned conversation behavior
Chatspace    = workspace + organization + spatial navigation + local knowledge
```

We win if the user can keep the response quality they already value while gaining an IDE/Obsidian-like workspace for navigation.

## 3. Target experience

Desktop-first, keyboard-friendly, dense but calm.

```text
┌────────────────┬──────────────────────────────┬──────────────────┐
│ LEFT           │ CENTER                       │ RIGHT            │
│                │                              │                  │
│ chat tree      │ active artifact              │ conversation     │
│ nested folders │ graph / outline / note       │ provider surface │
│ pins/search    │ split/tabs                    │                  │
└────────────────┴──────────────────────────────┴──────────────────┘
```

The workspace should feel closer to an editor than a dashboard.

## 4. Core entities

### Workspace
A local organizational boundary containing folders, chat references, tabs, views, annotations, and notes.

### Chat reference
A local reference to a provider conversation. It contains only metadata Chatspace is permitted to store.

### Folder
A nested local container. Folder hierarchy is independent of provider projects unless an official mapping exists.

### Tab
A restorable workspace view: chat reference, note, graph, outline, or future supported artifact.

### Graph
A projection of permitted/local structured data. Graphs are navigation surfaces, not decorative visualizations.

### Note
User-owned Markdown content, eventually bridgeable to an Obsidian vault or filesystem companion.

### Provider adapter
A narrow capability boundary around provider-specific behavior. It exposes only capabilities that are technically and policy supported.

## 5. MVP scope

The first useful product is not a full knowledge OS.

### MVP must prove

1. Chatspace can coexist with ChatGPT web without degrading normal ChatGPT usage.
2. The injected workspace UI is fast, stable, resizable, and reversible.
3. Local folders/tabs/pins improve navigation.
4. State survives browser restarts.
5. Provider-specific breakage remains isolated behind a compatibility adapter.
6. The extension can deliver value without private endpoints or automated extraction of provider output.

### MVP features

- extension shell on supported ChatGPT pages
- collapsible left workspace tree
- nested local folders
- local chat references created through an explicit supported/user action
- pin/recent organization
- tabs with remembered local UI state
- center workspace placeholder supporting local notes and future graph views
- resizable three-panel layout
- keyboard command palette for local actions
- IndexedDB persistence
- compatibility health indicator
- settings + data reset/export for Chatspace-owned local data

## 6. Explicit non-goals for MVP

Do not implement in early iterations:

- an alternative ChatGPT network client
- automatic conversation crawling/import
- provider account/token handling
- cross-device sync
- collaborative workspaces
- mobile browser support
- AI-generated semantic graph extraction from live ChatGPT DOM
- embeddings/vector database
- Obsidian filesystem write bridge
- multi-provider abstraction beyond the minimum interface needed to avoid hard coupling
- plugin marketplace

## 7. Later product layers

Only after the workspace shell is validated:

### Layer 2 — Navigation intelligence
- local outline navigation where data source is permitted
- user-curated graph nodes/edges
- bookmarks/annotations
- workspace search

### Layer 3 — Durable knowledge
- Markdown notes
- explicit export/import
- Obsidian bridge/local companion if justified
- backlinks between local notes and chat references

### Layer 4 — Provider-supported enrichment
Only through provider-supported paths such as official APIs, exports, SDKs, or explicit permission:
- richer conversation indexing
- semantic concept graph
- conversation transformations
- summaries and learning-state extraction

## 8. Success metrics

Product metrics should answer whether spatial organization improves real work.

### Primary

- time-to-return-to-context: time required to reopen a previously used conversation/work item
- navigation actions per successful context switch
- weekly retained workspaces
- percent of sessions using 2+ Chatspace navigation primitives (folder/tab/pin/search)

### Reliability

- extension-induced page error rate
- adapter compatibility pass rate
- state corruption rate
- cold-start workspace render latency
- interaction latency for tree/tab operations

### Delivery

- lead time from accepted task to merged increment
- PR cycle time
- escaped defect count
- rollback/revert rate
- flaky test rate

Avoid vanity metrics such as lines of code, commits per day, or number of agent actions.

## 9. Product principles

1. **Do not replace what already works.** Preserve provider conversation behavior.
2. **Navigation beats decoration.** Every graph or panel must reduce a real navigation cost.
3. **Local data must remain understandable.** Prefer explicit schemas and exportability.
4. **Keyboard and mouse are peers.** Core actions must work through both.
5. **Dense, not cluttered.** Information hierarchy matters more than visual effects.
6. **Failure must degrade gracefully.** If Chatspace breaks, normal ChatGPT must remain usable.
7. **Compatibility is a feature.** Provider UI changes are expected operational events.
8. **Compliance is architecture.** A feature that depends on prohibited extraction is not a valid feature plan.

## 10. Product acceptance question

Before adding a feature, answer:

> What navigation, organization, or knowledge-work friction becomes measurably easier after this change?

If the answer is vague, do not build it yet.
