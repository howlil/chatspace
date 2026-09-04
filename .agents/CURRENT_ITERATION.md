# Current Iteration

Status: **READY_FOR_MERGE**

## Feature Compass

**Shape:** Chatspace is a local-first companion beside native ChatGPT. Its core loop now continues beyond save/find/resume into explicit user-authored knowledge distillation without taking ownership of provider conversation content.

**Position:** M19 — Conversation-to-Knowledge Distillation Loop is implemented and deterministically verified on PR #45.

**Delta:** M19 turns the existing `ChatReference` ↔ `LocalNote.linkedChatIds` relationship into a coherent product workflow: current or saved conversations can be distilled into durable notes; unsaved conversations reuse the normal Save contract before note creation; notes expose actionable source provenance; conversation details derive linked knowledge notes; multiple notes per source remain explicit; Inbox organization preserves provenance; and existing Quick Open retrieves distilled note content.

**Next Move:** PR #45 is ready for Product Authority merge decision. Do not extend M19 with automatic summaries, provider-content access, semantic search, Graph work, richer properties/views, or sync work by default.

## Milestone decomposition

```text
Product purpose: durable local context and user-owned knowledge around native ChatGPT
Core journey: current context -> save -> remember -> continue/find -> resume -> distill -> own
Milestone: M19 — Conversation-to-Knowledge Distillation Loop

Slice 1 — First-class Distill action
  COMPLETE
  current conversation + saved conversation entry points

Slice 2 — Source-linked durable note creation
  COMPLETE
  existing LocalNote.linkedChatIds; no schema migration

Slice 3 — Actionable source provenance inside notes
  COMPLETE
  From conversation -> Resume through validated provider navigation

Slice 4 — Conversation -> linked knowledge projection
  COMPLETE
  derived linked-note list; no duplicated reverse persisted truth

Slice 5 — Duplicate-noise control
  COMPLETE
  existing linked notes visible before explicit New note from conversation
  multiple durable notes per conversation remain allowed

Slice 6 — Inbox continuity
  COMPLETE
  organizing a linked Inbox note preserves linkedChatIds

Slice 7 — Retrieval + source round trip
  COMPLETE
  existing Quick Open note-content indexing retrieves distilled knowledge

Slice 8 — Integrated deterministic verification
  COMPLETE
  save -> distill, retrieval -> resume, reverse projection, multi-note, provenance preservation
```

## M19 product outcome

A user can turn an important ChatGPT conversation into durable local knowledge without manually rebuilding source relationships. Distillation creates a normal editable Markdown note seeded from Chatspace-owned local metadata only. The note remembers its canonical local chat reference, exposes the source conversation as a direct resume action, and remains searchable through existing local retrieval.

```text
Native ChatGPT conversation
-> Save if needed
-> Distill
-> user-authored durable Markdown note
<-> source ChatReference
-> find note later
-> resume native ChatGPT source
```

## Acceptance status

- [x] current supported conversation exposes a first-class Distill action;
- [x] an unsaved conversation uses the existing Save contract and immediately continues into note creation;
- [x] a saved conversation can create a source-linked durable note directly;
- [x] distilled note title is seeded from the editable local chat label, not inferred from provider messages;
- [x] the existing `LocalNote.linkedChatIds` contract is reused; workspace schema remains v4;
- [x] linked source conversations are visible and actionable from the note editor;
- [x] source Resume uses the existing validated provider-navigation path;
- [x] conversation details derive linked knowledge notes from canonical note state;
- [x] existing linked notes are visible before explicit creation of another note;
- [x] multiple notes may intentionally reference one conversation;
- [x] organizing an Inbox-linked note preserves source provenance;
- [x] distilled note content participates in existing deterministic Quick Open retrieval;
- [x] no provider DOM/message/history scraping, automatic summary, embeddings, AI-generated tags/titles, transcript storage, schema change, Graph/property/view expansion, template expansion, background sync, or new provider was introduced;
- [x] focused M19 deterministic coverage is present;
- [x] full relevant repository CI is green.

## Verification evidence

- PR: #45 — `feat: close conversation-to-knowledge distillation loop (M19)`.
- Verified head: `bc68ac917005507304d237abda1924a64587013b`.
- CI #309 (`33919921480`) passed frozen install, lint, strict TypeScript, deterministic tests, extension production build/ZIP, and final `verify`.
- Test result: **36 test files passed / 127 tests passed**.
- M19-specific suite: **5/5 passed** covering unsaved save→distill, saved distill→retrieval→source resume, reverse linked-knowledge projection, explicit additional note creation, and Inbox provenance preservation.
- `LocalNoteEditor` source-resume contract has focused component coverage.
- Production Chromium MV3 package built successfully as `.output/chatspace-0.0.0-chrome.zip`.
- Initial CI failed only because legacy `LocalNoteEditor` tests did not provide the newly required `onOpenChat` callback; tests were aligned without weakening the production contract or TypeScript strictness.
- A later M19 test failure came from a global selector matching the same note in both Library and the intentional conversation Knowledge projection; the test was scoped to the Knowledge surface rather than removing valid dual discoverability.

## Completion rule

M19 implementation and verification are complete. PR #45 remains unmerged until an explicit merge decision. Separate black-box/live-browser acceptance is not required. After integration, select the next milestone from observed remaining core-journey friction rather than expanding advanced PKM features by default.
