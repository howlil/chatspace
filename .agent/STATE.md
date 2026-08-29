# Project State

Updated: 2026-08-29

This is a short operational snapshot. Durable product/architecture/history belongs in the owning `.agent` documents and plans/ADRs.

## Current

- `master` includes Explorer hierarchy/theme, canonical lean workflow, coalesced/serialized workspace persistence, obsolete ChatGPT content-script removal, risk-based testing policy, verification cleanup, canonical codebase-quality rules, bounded ownership/integrity cleanup, reproducible frozen pnpm installs, the UI consistency cleanup from PR #19, the workbench-height/navigation correction from PR #21, and the writing-first note/tree interaction cleanup from PR #23.
- Core daily-driver flow: detect a supported ChatGPT conversation URL, save a local reference, organize it, resume through Home/Explorer/tabs, and navigate native ChatGPT.
- Production persistence uses extension-owned `chrome.storage.local`, coalesces rapid snapshots, and serializes physical writes.
- Workspace folder hierarchy and local entity folder ownership are domain invariants: cyclic hierarchy, missing parent folders, and chat/note references to missing folders are rejected at the reducer and persistence/import boundary.
- The Side Panel entrypoint is the concrete composition root for the workspace repository, localhost vault bridge, permission request, provider-tab adapter, and ephemeral top-level utility view selection. `WorkspaceApp` owns application orchestration rather than constructing infrastructure adapters.
- Provider presence/navigation use the validated active-tab `browser.tabs` boundary; no ChatGPT content script or provider DOM bridge is required for the core path.
- The validated ChatGPT navigation wrapper remains intentional because it protects URL/origin constraints independently of the concrete browser-tab adapter.
- Dead bootstrap shell code has been removed. Large feature components are not split by line count; extraction requires a real ownership or independent-changeability gain.
- Browser-native folder/chat rename and delete dialogs have been replaced by Chatspace-owned dialogs. Folder/chat/note destructive mutation occurs only after explicit Chatspace confirmation.
- Explorer global create/save controls are icon-only with accessible labels/tooltips. Folder/chat/note target actions live in right-click context menus with hover/focus kebab access as a discoverability and keyboard-focus fallback.
- Folder context actions include new subfolder, new note here, rename, and delete. Workspace root offers new folder/new note. Chat and note context menus own their corresponding open/edit, rename, move, pin where applicable, and delete actions.
- Note title remains directly editable in the note header. Title edits synchronize the open note tab title; an empty title falls back to `Untitled note`.
- Note Edit/Preview is an icon-only mode control with explicit accessible labels/tooltips.
- Note secondary context is ephemeral and collapsible. Collapsed mode hides `Related locally`, linked-chat controls, and linked-chat chips while retaining the `chars · tags` summary and an explicit expand control so writing space becomes primary.
- Markdown sync is opened from a header utility icon beside the theme control and rendered as a dedicated ephemeral view that reuses the existing localhost bridge component.
- The Markdown Sync page exposes an explicit `Back to workspace` action; returning preserves existing workspace state because the utility page remains ephemeral rather than becoming a persisted tab.
- Workbench content is explicitly placed in the flexible viewport row even when no persistence warning exists. Note editing therefore uses the remaining workbench height instead of leaving the flexible row empty below a short auto-sized editor surface.
- When note context is expanded, the narrow note relation rail remains capped at `25dvh` with internal overflow so secondary local-relation context does not dominate a narrow side-panel viewport.
- Note-context expanded/collapsed state and Markdown Sync presentation are ephemeral UI state, not persisted workspace state. The workspace schema and `TabKind` contract remain unchanged.
- Verification is risk-based; current CI keeps frozen dependency install, lint, strict typecheck, deterministic tests, and one WXT build+ZIP package gate.
- `shellCollapsed` and `shellWidth` remain in the persisted schema. Do not remove or migrate them without explicit approval for a persisted-contract change.
- PR #11 is merged as `662fba2`: `pnpm-lock.yaml` is committed, CI uses `pnpm install --frozen-lockfile`, the temporary artifact helper is absent, and repository CI permissions remain `contents: read`.
- PR #19 is merged as `af900a7`: internal rename/delete dialogs, compact note relation rail, and the dedicated Markdown Sync header utility view are in `master`.
- PR #21 is merged as `f9e003e`: workbench content occupies the intended flexible viewport row and Markdown Sync has explicit back navigation.
- PR #23 is merged as `ed17df7`: Explorer/note controls are compact, note title/tab titles stay aligned, note context can collapse, and target-owned tree context menus replace the permanent folder action footer.
- The post-merge `master` CI run for `ed17df7` passed frozen install, lint, strict typecheck, deterministic tests, and WXT build+ZIP packaging.
- Live-browser interaction/visual acceptance remains outside repository CI.

## Canonical operating model

`AGENTS.md` is the single lifecycle source:

```text
USER INTENT
-> UNDERSTAND
-> BOUND
-> SPECIFY
-> DESIGN
-> IMPLEMENT
-> VERIFY
-> QUALITY GATES
-> RELEASE READY
-> STOP
```

Authority model:

```text
User: WHY / WHAT / product semantics / scope / material architecture / final decision
Agent: high autonomy for ordinary local engineering execution inside approved boundaries
```

Material changes to data ownership, public/persisted contracts, major communication/consistency models, security/privacy/permission/trust boundaries, infrastructure architecture, or destructive data behavior require explicit approval.

## Current architecture constraints

- local-first workspace; `chrome.storage.local` owns canonical workspace state
- native ChatGPT owns conversation runtime/content
- provider integration is URL-only and origin-scoped through validated browser-tab reads/navigation
- no provider DOM/content script is required for core behavior
- no private APIs, cookie/session reuse, history crawling, DOM scraping, automated output extraction, network replay, or protection bypasses
- optional authenticated localhost Markdown/vault bridge is secondary, session-scoped, and note-only
- Markdown Sync presentation and note-context collapse state are ephemeral shell/workbench UI state, not canonical workspace state
- graph is a projection, never canonical storage

## Current testing / verification rule

For every change:

```text
realistic failure
-> impact + likelihood
-> cheapest high-signal verification
-> broaden only when justified
-> required repository quality gates
-> stop when sufficient
```

- TDD is used when deterministic automated testing is the cheapest high-signal protection
- no mandatory TDD for presentation/layout/copy/trivial wiring/exploratory work
- no duplicate confidence across layers without distinct failure modes
- no full-suite/full-build repetition during the local loop by habit
- mandatory repository/CI gates still apply before merge
- release-specific verification happens only for a real release candidate or a risk that requires it

## Delivery-health findings

- The dominant observed delivery waste was batch/scope growth and rework, not CI runtime.
- Small bounded PRs after the initial convergence work reduced change surface and review complexity.
- Current CI is short enough that selective-test/path-filter infrastructure is not justified.
- Do not add a metrics platform, broad audit ritual, agent orchestrator, or selective-test framework without a concrete blocking need.
- Do not split cohesive feature components or introduce new layers merely to reduce file length.

## Release state

Daily-driver candidate, not yet public/store-ready.

## Next highest-ROI sequence

1. Perform bounded live-browser acceptance of the current daily-driver flow, including the PR #19, PR #21, and PR #23 UI behavior.
2. After real use, treat observed friction as evidence for a user product decision; do not implement unapproved feature scope automatically.

## Manual acceptance still required for current daily-driver candidate

After reloading the unpacked extension:

1. verify Explorer top-level folder/note/save-chat actions are icon-only, understandable by hover tooltip, and remain keyboard-focus accessible
2. right-click Workspace root and a folder; verify root offers new folder/new note while a folder offers new subfolder/new note here, and newly created items get the intended parent
3. right-click folder/chat/note rows and use the kebab fallback; verify the same target-owned actions are available and menu placement stays inside the viewport
4. rename/delete folder/chat/note targets and confirm Chatspace-owned dialogs appear; cancel must not mutate state and destructive confirmation must mutate only the selected target
5. drag folder/chat/note into another folder and back to Workspace root; verify ancestor → descendant folder drop still does not mutate hierarchy
6. edit a note title directly and confirm its open tab title follows; clear the title and blur to confirm the `Untitled note` fallback
7. verify Edit/Preview is icon-only with clear active state, tooltip, and keyboard focus
8. collapse note context and confirm only the chars/tags summary plus expand affordance remain below the editor; expand it and confirm `Related locally` and linked-note/chat context return
9. confirm the note editor still uses the remaining workbench height in both expanded and collapsed context states
10. on a narrow Side Panel with context expanded, verify `Related locally` remains secondary and scrolls internally when its content exceeds the bounded rail height
11. open Markdown Sync from the header, confirm `Back to workspace` is obvious, and verify returning preserves the active workspace state
12. switch light/dark mode, close/reopen Side Panel, verify preference persists
13. inspect Home, Explorer, notes, tabs, graph, dialogs, context menus, Markdown Sync, and settings in both themes
14. confirm supported ChatGPT conversation detection/navigation works with no content script registered

## Blocked

- No known runtime code blocker.
- Live-browser acceptance cannot be proven by repository CI alone.
