# Current Milestone

Status: **READY_FOR_MILESTONE**

Goal: No product implementation milestone is currently authorized.

Why: The repository is in a releasable daily-driver-candidate state. The next meaningful implementation outcome should be bounded from an explicit user request rather than inferred from backlog/history.

## Feature Compass

**Shape:** Chatspace is a local-first Chromium Side Panel workspace beside native ChatGPT, with Explorer, notes, spatial Graph navigation, validated ChatGPT URL navigation, and manual direct-folder Markdown Sync.

**Position:** The latest delivered product state includes direct selected-folder Markdown Sync and usable spatial Graph navigation. Repository CI covers deterministic code/build/package checks; live-browser interaction remains environment-specific.

**Delta:** No authorized product delta is active.

**Next Move:** On the next explicit implementation request, bound one meaningful milestone from the requested outcome, write its slices here once, then execute continuously.

## Scope

### In

- Keep this file as the single active engineering-state source.
- Record the next authorized milestone, active slice, completed slices, evidence, blockers, and one next action.

### Out

- Do not turn current observations into implementation scope automatically.
- Do not create per-slice sprint files or `.agents/plans/*`.
- Do not remove the retained localhost bridge until the user authorizes that cleanup after direct-folder live acceptance.
- Do not persist dragged Graph positions without an explicit persisted-contract/product decision.

## Slices

No active milestone slices.

When a milestone starts, use:

```text
- [ ] Slice A <- ACTIVE
- [ ] Slice B
- [ ] Slice C
```

Integrate at logical-change boundaries; a slice is not automatically a branch or PR.

## Current Decisions

- Native ChatGPT remains the conversation runtime; Chatspace remains the local Side Panel workspace.
- Canonical workspace state remains in extension-owned `chrome.storage.local`.
- Provider integration remains URL/tab-only.
- Direct-folder Markdown Sync is the primary vault path; its directory handle remains separate from `WorkspaceSnapshot` in IndexedDB.
- Graph remains a projection; session-only dragged positions remain ephemeral.

## Verification / Evidence

- `package.json` defines lint, strict typecheck, Vitest, WXT build/zip, and frozen pnpm tooling.
- CI runs frozen dependency install, lint, typecheck, tests, and WXT ZIP packaging.
- `ProviderTabsPort` and direct local-vault adapter are present in current source.
- The latest recorded Graph and direct-folder increments passed repository CI.

## Blockers / Risks

- No known repository/CI runtime blocker.
- `showDirectoryPicker()` behavior, write permission, and restored directory-handle behavior inside the actual Chromium Side Panel require live-browser acceptance.
- Live narrow-panel Graph interaction/visual acceptance is not proven by repository CI.

## Candidate next milestone — not authorized

A reasonable candidate is bounded daily-driver live acceptance of:

1. spatial Graph interaction in a real narrow Side Panel;
2. direct-folder connect/write/update/restore/reconnect behavior;
3. provider navigation with no ChatGPT content script.

This is orientation only, not implementation authorization.

## Next Action

Wait for the next explicit user implementation request. Then:

1. set one milestone goal and why;
2. define in/out scope and observable milestone acceptance;
3. list ordered slices;
4. mark exactly one active slice;
5. execute slices continuously and update this file only at meaningful state transitions;
6. run the milestone gate when planned slices are complete;
7. stop at milestone exit or a material blocker/decision.
