# Project State

Updated: 2026-08-28

## Current

- `master` includes PR #7 (Explorer hierarchy/theme), PR #8 (canonical lean agent workflow), and PR #9 (coalesced/serialized workspace persistence).
- Core daily-driver flow remains: detect a supported ChatGPT URL, save a local reference, organize it, resume from Home/Explorer/tabs, and navigate native ChatGPT.
- Production persistence now buffers rapid workspace state transitions and serializes physical Chrome-storage writes instead of issuing overlapping writes for every state transition.
- The active cleanup slice removes the obsolete ChatGPT content-script message bridge. Provider presence and navigation already use the active-tab `browser.tabs` boundary.
- Final live-browser interaction/visual acceptance for the merged PR #7 behavior remains external to repository CI.

## Delivery-health findings

- The dominant delivery waste observed was **batch/scope growth and rework**, not CI runtime.
- PR #7 reached 22 changed files and 24 commits before merge; subsequent work is being split into small observable slices with explicit stop conditions.
- `AGENTS.md` is the canonical execution lifecycle; `.agent/` holds durable product/architecture context without duplicating workflow across many role files.
- Current CI does not justify a new metrics platform, large test matrix, orchestration framework, or speculative architecture.

## Architecture constraints

- local-first workspace; `chrome.storage.local` owns canonical workspace state
- native ChatGPT owns conversation runtime/content
- provider integration is URL-only and origin-scoped through validated active-tab reads/navigation
- no provider DOM/content script is required for the core workspace/provider path
- no private APIs, cookie/session reuse, history crawling, DOM scraping, automated output extraction, network replay, or protection bypasses
- optional localhost Markdown/vault bridge is secondary, not on the critical capture/navigation path

## Interaction state delivered by PR #7

- top-level `Folder` creates at Workspace root regardless of current selection
- intentional nesting uses explicit `New subfolder here`
- folder/chat/note items can move between folders and Workspace root
- invalid folder self/descendant moves are rejected
- theme preference persists and primary surfaces use semantic Tailwind tokens
- UI affordances touched by the slice use Lucide icons

## Persistence state delivered by PR #9

- rapid workspace snapshots within the persistence debounce window coalesce to the latest snapshot
- physical storage writes are serialized
- a later save does not start while an earlier physical write is unresolved
- clearing storage cancels a buffered save before the clear operation
- memory/test repository behavior remains immediate

## Release state

Daily-driver candidate, not yet a public release candidate.

## Next highest-ROI sequence

1. Finish the dead content-script removal with regression/build verification, then merge.
2. Commit a reproducible `pnpm-lock.yaml` and switch CI to frozen install before public distribution.
3. Perform live-browser acceptance of the merged daily-driver interaction flow before treating the extension as a release candidate.

## Manual acceptance still required

After reloading the unpacked extension:

1. create Folder A, select it, then click top-level Folder again; the new folder must appear at root
2. use `New subfolder here` on Folder A and confirm only this explicit action creates a child
3. drag folder/chat/note into another folder and back to Workspace root
4. verify invalid ancestor → descendant folder drop does not mutate hierarchy
5. switch light/dark mode, close/reopen the side panel, and verify the preference persists
6. check Home, Explorer, notes, tabs, graph, dialogs, and settings in both themes
7. confirm supported ChatGPT conversation detection/navigation still works with no content script registered

## Blocked

No known code blocker. Live-browser visual/interaction acceptance cannot be proven by repository CI alone.
