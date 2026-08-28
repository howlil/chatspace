# Project State

Updated: 2026-08-28

## Current

- `master` includes PR #7 (Explorer hierarchy/theme), PR #8 (canonical lean agent workflow), PR #9 (coalesced/serialized workspace persistence), and PR #10 (obsolete ChatGPT content-script bridge removal).
- Core daily-driver flow remains: detect a supported ChatGPT URL, save a local reference, organize it, resume from Home/Explorer/tabs, and navigate native ChatGPT.
- Production persistence buffers rapid workspace state transitions and serializes physical Chrome-storage writes.
- Provider presence/navigation use the validated active-tab `browser.tabs` boundary; no provider content script is required for the core path.
- `chore/risk-based-verification-policy` updates canonical testing/verification rules so tests reduce meaningful delivery risk rather than maximize coverage/test count/ceremony.
- PR #11 is the remaining reproducible-install slice. CI generated a valid `pnpm-lock.yaml`; the final intended diff is lockfile + frozen install with no temporary artifact-upload helper.
- Final live-browser interaction/visual acceptance remains external to repository CI.

## Delivery-health findings

- The dominant delivery waste observed was **batch/scope growth and rework**, not CI runtime.
- PR #7 reached 22 changed files and 24 commits before merge; subsequent runtime cleanup used small bounded slices.
- `AGENTS.md` is the canonical execution lifecycle; `.agent/` holds durable product/architecture/testing context without duplicating workflow across role files.
- Testing policy is now explicitly economic/risk-based: choose the cheapest high-signal evidence, broaden only when impact/likelihood justify it, and avoid duplicate confidence.
- Current CI does not justify a metrics platform, large test matrix, orchestration framework, or speculative selective-test infrastructure.

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

## Testing & verification operating rule

For every change:

```text
realistic failure
      ↓
impact + likelihood
      ↓
cheapest high-signal verification
      ↓
broaden only if justified
      ↓
sufficient confidence
      ↓
stop
```

- TDD is preferred when deterministic automated testing is the cheapest useful signal, especially for invariants, persistence, concurrency, migrations, security/privacy boundaries, provider contracts, and valuable regressions.
- TDD is not mandatory for styling/layout, presentation-only work, static markup, copy/content, trivial wiring, exploratory work, or cases better verified another way.
- do not test the same behavior at multiple layers unless each layer detects a different meaningful failure mode
- do not run every available check for every local change
- release-specific verification is broader only when actually approaching a release

## Release state

Daily-driver candidate, not yet a public release candidate.

## Next highest-ROI sequence

1. Merge the risk-based verification policy after its low-risk documentation acceptance/CI check.
2. Finalize PR #11 with committed `pnpm-lock.yaml` + `pnpm install --frozen-lockfile`, removing its temporary artifact-upload helper.
3. Perform live-browser acceptance of the merged daily-driver interaction flow.
4. After real usage, fix only observed high-value friction; do not invent new feature scope.

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

- No known runtime code blocker.
- Live-browser visual/interaction acceptance cannot be proven by repository CI alone.
- PR #11 finalization requires committing the generated lockfile without broadening CI repository-write permission; the lockfile artifact is already generated and validated.
