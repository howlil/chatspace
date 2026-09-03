# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: Make capture from an active ChatGPT work session nearly frictionless without expanding provider access.

## Feature Compass

**Shape:** Chatspace now owns a reserved root `Inbox` folder backed by ordinary `LocalNote` entities. `Ctrl/⌘+Shift+N`, the explorer toolbar, or Quick Open can open a compact capture dialog; Enter saves locally, Shift+Enter adds a newline. If the current validated ChatGPT URL already has a saved local reference, the capture links to that reference without reading provider content. Home exposes actionable Inbox captures and existing M10 triage handles later organization.

**Position:** M14 — Capture Inbox is complete and ready to integrate.

**Delta:** Added deterministic Inbox normalization for new/existing schema-v2 workspaces, domain guards that keep Inbox reserved at workspace root, zero-decision quick capture, optional saved-chat association, Home integration, and deterministic capture coverage. M13 broken-link recovery actions are also wired into the active note context.

**Next Move:** Execute the already-approved M15 — Markdown Import & Round-trip milestone from fresh `master` after M14 integration.

## Scope

### In

- reserved root Inbox using the existing `LocalNote` model;
- no new capture entity and no workspace schema-version change;
- `Ctrl/⌘+Shift+N` quick capture;
- Enter save / Shift+Enter newline / Escape close through Radix Dialog behavior;
- first meaningful line as capture title;
- association only to an already-saved local chat reference matching the current validated ChatGPT URL;
- Home Inbox count/items;
- existing bulk move/archive/delete/Quick Open triage reuse;
- reserved Inbox rename/delete/nesting protection.

### Out

- no provider DOM/content extraction;
- no auto-created chat reference;
- no tags/folder decision during capture;
- no Daily Notes, reminders, task manager, AI classification, or separate capture database;
- no black-box/live-browser milestone.

## Verification / Evidence

- WorkspaceApp capture test covers the shortcut, persisted Inbox note, title/content, and association to an already-saved current chat reference.
- Workspace reducer tests cover Inbox invariants and existing folder semantics.
- Existing note-link, Graph, persistence, retrieval, migration, portable export, settings, vault, provider adapter, WXT packaging, and landing build remain in the repository gate.

## Blockers / Risks

- No known product blocker.
- Inbox is normalized into existing valid schema-v2 workspaces without changing the schema number; it is a reserved product-owned folder contract.

## Next Action

Integrate M14 after the final repository gate is green, then execute M15.
