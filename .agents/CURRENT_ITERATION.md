# Current Iteration

Status: **READY_FOR_MILESTONE**

## Feature Compass

**Shape:** Chatspace is a local-first companion beside native ChatGPT whose core loop is save important work, remember why it matters, find it again, resume the native conversation, distill durable notes, and keep user-owned knowledge portable.

**Position:** M17 — Core Capture, Retrieval & Resume is complete.

**Delta:** M17 shifts product emphasis back to the highest-frequency core loop: saved chats now carry optional user-authored `Why saved` context; Home provides a unified Continue working set; Quick Open ranks local retrieval by relevance with pin/recency tie-breaks; new workspaces no longer seed the Learning Note preset; and default Graph UX no longer authors new manual relationships while preserving existing user data.

**Next Move:** Select the next milestone only from a meaningful remaining gap in the core user journey. Do not expand advanced PKM primitives without an explicit product outcome.

## Completed milestone decomposition

```text
Product purpose: durable local context around native ChatGPT
Core journey: save -> remember why -> continue/find -> resume -> distill -> own
Milestone: M17 — Core Capture, Retrieval & Resume

Slice 1 — Intentful low-friction capture
  COMPLETE
  annotation + schema v4 migration + editable Why saved

Slice 2 — Unified Continue experience
  COMPLETE
  recent chats + notes as one temporal working set

Slice 3 — Context-aware Quick Open
  COMPLETE
  title/context/content/folder indexing + deterministic relevance/recency/pin ranking

Slice 4 — Core-product simplification
  COMPLETE
  no Learning Note seeded in new workspaces
  legacy Learning Note data preserved but not default UX
  Graph/properties/views remain advanced
  new manual Graph-edge authoring removed from default product path
  existing manual edges remain readable/deletable

Slice 5 — Integrated deterministic acceptance
  COMPLETE
  repository-owned core workflow verified through deterministic integration coverage and CI
```

## M17 product outcome

Users can save an important ChatGPT conversation with minimal friction, optionally record why it matters, see recent local work as one coherent Continue surface, retrieve it through context-aware Quick Open, and resume the validated native ChatGPT target without provider-content extraction.

## Acceptance status

- [x] save-current-chat keeps name required while folder/pin remain optional secondary decisions;
- [x] optional `Why saved` context persists and remains editable;
- [x] schema v1/v2/v3 migrates deterministically to v4 without destructive user-data loss;
- [x] Home Continue combines active chats and non-Inbox notes by `updatedAt`;
- [x] Quick Open finds chat labels, local annotations, folder names, note titles/tags/content, and existing local structured metadata;
- [x] exact/prefix/title relevance remains stronger than context/content matches, with pinned/recent work used as deterministic tie-break signals;
- [x] empty-query Quick Open favors recent/pinned work before commands and secondary containers;
- [x] deterministic application coverage verifies Quick Open annotation retrieval and validated provider navigation invocation;
- [x] new workspaces do not seed the built-in Learning Note;
- [x] existing template data remains preserved while the legacy Learning Note is not promoted in default Quick Open;
- [x] default Graph UX no longer authors new manual relationships; existing manual relations remain visible and explicitly deletable;
- [x] no provider DOM/history/content scraping, embeddings, semantic search, database-view expansion, Graph expansion, or automatic filesystem sync was introduced;
- [x] PROJECT.md, ARCHITECTURE.md, README.md, PRIVACY.md, AGENTS.md, QUALITY.md, and DECISIONS.md reflect the resulting product/verification boundary;
- [x] deterministic repository gates pass;
- [x] black-box/live-browser testing is not a required milestone completion gate.

## Verification evidence

PR #43 automated verification on the M17 implementation established:

- frozen pnpm install: passed;
- lint: passed;
- strict TypeScript typecheck: passed;
- deterministic tests: **116 passed across 34 files**;
- M17 core-flow coverage verifies save + Why saved persistence/editing, annotation retrieval, validated resume invocation, unified Continue behavior, and legacy manual-edge deprecation behavior;
- extension production build/package: passed;
- Chromium MV3 ZIP produced successfully;
- landing build correctly skipped on the extension-only PR surface;
- final relevant-gate verifier passed.

The first PR CI attempt failed at strict typecheck because `exactOptionalPropertyTypes` rejected explicitly propagated absent retrieval signals. The retrieval DTO contract was corrected without weakening TypeScript or CI, and the subsequent full relevant gate passed.

## Completion rule

M17 is complete based on repository-owned deterministic evidence and green CI. Separate black-box/live-browser acceptance is intentionally not required. Manual runtime inspection may still be used when useful for debugging or product observation, but it does not block milestone completion or merge.
