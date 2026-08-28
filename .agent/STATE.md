# Project State

Updated: 2026-08-28

## Current

- `master` includes PR #7 (`feat: improve explorer hierarchy and theme controls`) at `8117596`.
- PR #7 CI passed before merge; the codebase now has explicit root/subfolder creation, reversible Explorer drag/drop hierarchy, persistent light/dark theme, and Lucide-based UI affordances for the touched surfaces.
- Core daily-driver flow remains: detect a supported ChatGPT URL, save a local reference, organize it, resume from Home/Explorer/tabs, and navigate native ChatGPT.
- PR #8 is the active workflow/governance cleanup. `AGENTS.md` is the canonical lifecycle; `.agent/` keeps project knowledge plus task-relevant engineering context.
- Final live-browser interaction/visual acceptance for the merged PR #7 behavior remains external to repository CI.

## Delivery-health findings

- The dominant delivery waste observed so far is **batch/scope growth and rework**, not CI runtime.
- PR #7 reached 22 changed files and 24 commits before merge; future work should use smaller observable vertical slices and stop when acceptance passes.
- Agent governance previously duplicated workflow across roles/skills/quality/workflow documents; PR #8 removes that context-loading/reconciliation cost while preserving durable product and architecture knowledge.
- Current CI does not justify a new metrics platform, large test matrix, orchestration framework, or speculative architecture.
- Runtime persistence write amplification and the obsolete ChatGPT content-script path are separate code tasks; do not mix them into workflow cleanup.

## Architecture constraints

- local-first workspace; `chrome.storage.local` owns canonical workspace state
- native ChatGPT owns conversation runtime/content
- provider integration remains URL-only and origin-scoped
- no private APIs, cookie/session reuse, history crawling, DOM scraping, automated output extraction, network replay, or protection bypasses
- optional localhost Markdown/vault bridge is secondary, not on the critical capture/navigation path

## Interaction state delivered by PR #7

- top-level `Folder` creates at Workspace root regardless of current selection
- intentional nesting uses explicit `New subfolder here`
- folder/chat/note items can move between folders and Workspace root
- invalid folder self/descendant moves are rejected
- theme preference persists and primary surfaces use semantic Tailwind tokens
- UI affordances touched by the slice use Lucide icons

## Release state

Daily-driver candidate, not yet a public release candidate.

## Next highest-ROI sequence

1. Merge PR #8 after its rebased workflow/docs change passes CI.
2. Create a separate bounded persistence fix for debounced/serialized workspace saves.
3. Remove the confirmed-unused content-script provider bridge in a separate cleanup change after regression verification.
4. Commit a reproducible `pnpm-lock.yaml` and switch CI to frozen install before public distribution.

## Manual acceptance still required

After reloading the unpacked extension:

1. create Folder A, select it, then click top-level Folder again; the new folder must appear at root
2. use `New subfolder here` on Folder A and confirm only this explicit action creates a child
3. drag folder/chat/note into another folder and back to Workspace root
4. verify invalid ancestor → descendant folder drop does not mutate hierarchy
5. switch light/dark mode, close/reopen the side panel, and verify the preference persists
6. check Home, Explorer, notes, tabs, graph, dialogs, and settings in both themes

## Blocked

No known code blocker. Live-browser visual/interaction acceptance cannot be proven by repository CI alone.
