# Project State

Updated: 2026-08-29

This is a short operational snapshot. Durable product/architecture/history belongs in the owning `.agent` documents and plans/ADRs.

## Current

- `master` includes Explorer hierarchy/theme, canonical lean workflow, coalesced/serialized workspace persistence, obsolete ChatGPT content-script removal, risk-based testing policy, verification cleanup, canonical codebase-quality rules, bounded ownership/integrity cleanup, reproducible frozen pnpm installs, the UI consistency cleanup from PR #19, the workbench-height/navigation correction from PR #21, the writing-first note/tree interaction cleanup from PR #23, the compact Explorer/note-mode visual refinement from PR #25, and direct Obsidian folder sync from PR #27.
- Core daily-driver flow: detect a supported ChatGPT conversation URL, save a local reference, organize it, resume through Home/Explorer/tabs, and navigate native ChatGPT.
- Production persistence uses extension-owned `chrome.storage.local`, coalesces rapid snapshots, and serializes physical writes.
- Workspace folder hierarchy and local entity folder ownership are domain invariants: cyclic hierarchy, missing parent folders, and chat/note references to missing folders are rejected at the reducer and persistence/import boundary.
- The Side Panel entrypoint is the concrete composition root for the workspace repository, browser local-vault adapter, provider-tab adapter, and ephemeral top-level utility view selection. `WorkspaceApp` owns application orchestration rather than constructing infrastructure adapters.
- Provider presence/navigation use the validated active-tab `browser.tabs` boundary; no ChatGPT content script or provider DOM bridge is required for the core path.
- The validated ChatGPT navigation wrapper remains intentional because it protects URL/origin constraints independently of the concrete browser-tab adapter.
- Dead bootstrap shell code has been removed. Large feature components are not split by line count; extraction requires a real ownership or independent-changeability gain.
- Browser-native folder/chat rename and delete dialogs have been replaced by Chatspace-owned dialogs. Folder/chat/note destructive mutation occurs only after explicit Chatspace confirmation.
- Explorer global create/save controls are icon-only with accessible labels/tooltips. Their quick-action strip is compact and left-aligned, with 24px controls instead of a visually dominant primary Save tile. Folder/chat/note target actions live in right-click context menus with hover/focus kebab access as a discoverability and keyboard-focus fallback.
- Explorer search/root chrome is compact. `Workspace root` stays on one line, and the `Drop here` hint appears only during an actual root drag-over rather than consuming permanent row space.
- Folder context actions include new subfolder, new note here, rename, and delete. Workspace root offers new folder/new note. Chat and note context menus own their corresponding open/edit, rename, move, pin where applicable, and delete actions.
- Note title remains directly editable in the note header. Title edits synchronize the open note tab title; an empty title falls back to `Untitled note`.
- Note Edit/Preview is an icon-only segmented control with explicit accessible labels/tooltips, `aria-pressed`, and a high-contrast pressed state so the active mode is immediately visible.
- Note header, tag row, editor padding, and footer chrome are tightened so the writing surface remains visually primary without changing behavior.
- Note secondary context is ephemeral and collapsible. Collapsed mode hides `Related locally`, linked-chat controls, and linked-chat chips while retaining the `chars · tags` summary and an explicit expand control so writing space becomes primary.
- Markdown sync is opened from a header utility icon beside the theme control and rendered as a dedicated ephemeral view.
- The primary Markdown Sync flow now uses direct browser folder access: the user chooses an Obsidian vault through the native directory picker, and manual sync writes note Markdown only below `<vault>/Chatspace/`. No terminal, token, Node process, or localhost server is required in the primary UX.
- The selected vault directory handle is integration-owned state stored separately in IndexedDB. It is not part of `WorkspaceSnapshot`, workspace import/export, or the canonical `chrome.storage.local` workspace schema.
- Persisted vault handles are restored on reopen. If browser write permission is no longer granted, Markdown Sync surfaces an explicit Reconnect state; Change vault and Disconnect are also explicit user actions.
- Markdown Sync remains one-way and manual: Chatspace → selected vault. Automatic sync, filesystem watching, Obsidian → Chatspace, sync-all, conflict resolution, and bidirectional synchronization are not implemented or implied.
- The previous authenticated localhost bridge implementation remains in the repository temporarily as retained legacy/fallback code, but it is no longer composed into the primary Side Panel Markdown Sync flow. Removal is deferred until direct-folder behavior passes live-browser acceptance.
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
- PR #25 is merged as `a0b25b8`: Explorer quick actions/search/root chrome are denser, permanent root drop-hint noise is removed, and the note Edit/Preview state is high-contrast and explicit.
- PR #27 is merged as `de4eed2`: primary Markdown Sync uses direct selected-folder access, persists the selected directory handle outside workspace state, supports reconnect/change/disconnect, and manually writes the active note below the vault `Chatspace/` directory.
- The post-merge `master` CI run for `de4eed2` passed frozen install, lint, strict typecheck, deterministic tests, and WXT build+ZIP packaging.
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
- direct Markdown/vault integration is user-selected-folder only, manually writes notes below `<vault>/Chatspace/`, and stores its directory handle separately from workspace state in IndexedDB
- the old authenticated localhost Markdown/vault bridge remains retained but is no longer the primary Side Panel integration path; do not remove it until direct-folder live acceptance is complete
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

1. Perform bounded live-browser acceptance of the current daily-driver flow, especially PR #27 direct-folder Markdown Sync in the actual Chromium Side Panel context.
2. If direct-folder connect/write/restore succeeds in live use, decide whether to remove the retained localhost bridge and optional localhost permission as a bounded cleanup sprint.
3. After real use, treat observed friction as evidence for a user product decision; do not implement unapproved feature scope automatically.

## Manual acceptance still required for current daily-driver candidate

After reloading the unpacked extension:

1. verify Explorer top-level folder/note/save-chat controls form a compact quick-action strip, remain understandable by hover tooltip, and remain keyboard-focus accessible
2. verify Explorer search spacing is compact, `Workspace root` stays on one line at narrow widths, and `Drop here` appears only while dragging over the root row
3. right-click Workspace root and a folder; verify root offers new folder/new note while a folder offers new subfolder/new note here, and newly created items get the intended parent
4. right-click folder/chat/note rows and use the kebab fallback; verify the same target-owned actions are available and menu placement stays inside the viewport
5. rename/delete folder/chat/note targets and confirm Chatspace-owned dialogs appear; cancel must not mutate state and destructive confirmation must mutate only the selected target
6. drag folder/chat/note into another folder and back to Workspace root; verify ancestor → descendant folder drop still does not mutate hierarchy
7. edit a note title directly and confirm its open tab title follows; clear the title and blur to confirm the `Untitled note` fallback
8. switch Edit/Preview and confirm the active mode uses an obvious high-contrast pressed state while the inactive mode remains subdued; tooltip, keyboard focus, and `aria-pressed` semantics must remain correct
9. collapse note context and confirm only the chars/tags summary plus expand affordance remain below the editor; expand it and confirm `Related locally` and linked-note/chat context return
10. confirm the note editor still uses the remaining workbench height in both expanded and collapsed context states
11. on a narrow Side Panel with context expanded, verify `Related locally` remains secondary and scrolls internally when its content exceeds the bounded rail height
12. open Markdown Sync from the header and confirm `Back to workspace` remains obvious
13. click `Connect Obsidian`; verify the native directory picker opens from the Chromium Side Panel without terminal/token/server setup
14. select a real Obsidian vault; verify the UI shows the selected vault name and indicates that files are stored under `<vault>/Chatspace/`
15. with a note active, click `Sync current note`; verify `<vault>/Chatspace/<title>-<note-id>.md` is created with exactly the current note Markdown
16. edit the same note and sync again; verify the same file is updated instead of creating a duplicate for the same note ID
17. close/reopen the Side Panel; verify the selected directory handle is restored, or an explicit Reconnect state appears if the browser requires write permission again
18. cancel `Change vault`; verify the existing selected vault remains unchanged, then verify Change vault and Disconnect work when explicitly confirmed through their respective browser/UI flows
19. verify workspace export/import does not contain the filesystem directory handle and the persisted workspace schema/`TabKind` remain unchanged
20. switch light/dark mode, close/reopen Side Panel, verify preference persists
21. inspect Home, Explorer, notes, tabs, graph, dialogs, context menus, Markdown Sync, and settings in both themes
22. confirm supported ChatGPT conversation detection/navigation works with no content script registered

## Blocked

- No known repository/CI runtime code blocker.
- Actual `showDirectoryPicker()` availability, write access, and persisted directory-handle behavior inside the Chromium extension Side Panel cannot be proven by repository CI and require live-browser acceptance before the retained localhost bridge can be removed.
