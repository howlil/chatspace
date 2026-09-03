# Current Iteration

Status: **ACTIVE**

## Feature Compass

**Shape:** Chatspace is a local-first companion beside native ChatGPT whose core loop is save important work, remember why it matters, find it again, resume the native conversation, distill durable notes, and keep user-owned knowledge portable.

**Position:** M17 — Core Capture, Retrieval & Resume is active.

**Delta:** M16 completed structured properties, saved views, templates, and Markdown round trip. M17 deliberately shifts product emphasis back to the highest-frequency core loop instead of expanding PKM primitives.

**Next Move:** Complete all M17 slices, run risk-proportional repository gates, then perform real Chromium Side Panel acceptance where repository tests cannot establish browser behavior.

## Canonical active-work decomposition

```text
Product purpose: durable local context around native ChatGPT
Core journey: save -> remember why -> continue/find -> resume -> distill -> own
Capability gap: saved work lacks intent context and retrieval/resume is weaker than advanced PKM surfaces
Milestone: M17 — Core Capture, Retrieval & Resume

Slice 1 — Intentful low-friction capture
  annotation + schema v4 migration + editable Why saved

Slice 2 — Unified Continue experience
  recent chats + notes as one temporal working set

Slice 3 — Context-aware Quick Open
  title/context/content/folder indexing + deterministic recency/pin ranking

Slice 4 — Core-product simplification
  no Learning Note seeded in new workspaces
  legacy Learning Note data preserved but not default UX
  Graph/properties/views remain advanced
  new manual Graph-edge authoring removed from the default product path while existing edges remain readable/deletable

Slice 5 — Integrated acceptance
  deterministic core-flow coverage + real Side Panel acceptance where required
```

## M17 product outcome

Users can save an important ChatGPT conversation with minimal friction, optionally record why it matters, see recent local work as one coherent Continue surface, retrieve it through context-aware Quick Open, and resume the validated native ChatGPT target without provider-content extraction.

## Acceptance criteria

- save-current-chat keeps name required while folder/pin are optional secondary decisions;
- optional `Why saved` context persists and remains editable;
- schema v1/v2/v3 migrates deterministically to v4 without user-data loss;
- Home Continue combines active chats and non-Inbox notes by `updatedAt`;
- Quick Open can find chat labels, local annotations, folder names, note titles/tags/content, and existing local structured metadata;
- exact/prefix/title relevance remains stronger than context/content matches, with pinned/recent work used as deterministic tie-break signals;
- empty-query Quick Open favors recent/pinned work before commands and secondary containers;
- supported Quick Open chat results resume through the existing validated provider adapter;
- new workspaces do not seed the built-in Learning Note;
- existing imported template data remains preserved; the legacy Learning Note is not promoted in default Quick Open;
- default Graph UX no longer authors new manual relationships; existing manual relations remain visible and explicitly deletable;
- no provider DOM/history/content scraping, embeddings, semantic search, database-view expansion, Graph expansion, or automatic filesystem sync;
- repository truth is updated with the resulting product boundary;
- deterministic repository gates pass;
- real-browser acceptance is recorded separately and never mislabeled as a jsdom test.

## Verification state

Not yet complete. Do not mark M17 complete until implementation gates are green and any required live Chromium Side Panel behavior has real-environment evidence.
