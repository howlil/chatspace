# Current Project State

Last updated: 2026-08-25

## Current

PR #5 `feat: make Chatspace a daily-driver workspace` implements the P0–P4 vertical slice requested after live browser acceptance showed that the side-panel shell was structurally correct but the core daily workflow still lacked useful actions.

P0–P4 are implemented sequentially and each stage passed lint, strict TypeScript, tests, and the WXT production build before work proceeded to the next stage.

## Daily-driver product loop

```text
active ChatGPT conversation
        ↓
reliable URL-only detection
        ↓
Save conversation
        ↓
name + folder + optional pin
        ↓
Explorer management
        ↓
Continue / Pinned / Recent home
        ↓
chat tab / Explorer click
        ↓
native ChatGPT context switch
```

## P0 — reliable provider connection

- active ChatGPT tab detection no longer depends on a freshly injected content script
- ChatGPT-scoped host permission exposes only the active tab URL for `https://chatgpt.com/*`
- URL classification remains provider-adapter based and does not read conversation content
- reconnect state is actionable when the active tab is not ChatGPT
- side panel refreshes on activation/update/focus and a bounded polling interval
- validated navigation updates the active ChatGPT tab or opens the saved target in a new tab when needed

Evidence: CI run `32875404826` — PASS.

## P1 — explicit Save Conversation flow

- Save Current Chat opens a proper dialog instead of immediately creating `Conversation N`
- editable name
- folder selection
- optional pin
- duplicate URL handling
- normalized URL-only target persists locally
- successful save opens the local chat workbench context

Evidence: CI run `32875776222` — PASS.

## P2 — Explorer conversation management

- rename local conversation reference
- move reference between folders or Workspace root
- pin/unpin
- delete local reference with explicit wording that the ChatGPT conversation itself is not deleted
- management actions are available from the Explorer
- opening a saved chat updates its local activity timestamp

Evidence: CI run `32876098024` — PASS.

## P3 — resume-oriented Home

- Home no longer uses folder/chat/note counters as the primary experience
- `Continue` shows recently active saved chats
- `Pinned` exposes pinned saved chats
- `Recent notes` exposes recently updated local notes
- empty state directs the user toward the useful capture/curation loop

Evidence: CI run `32876345722` — PASS.

## P4 — native ChatGPT context switching

- activating a saved chat tab navigates native ChatGPT to its validated target
- Explorer and Home chat actions use the same navigation path
- duplicate-save handling resumes the existing saved conversation
- active chat workbench shows local metadata/actions rather than presenting the raw URL as the feature
- chat rename keeps an existing chat tab title synchronized
- acceptance tests verify native navigation and absence of raw URL workbench output

Evidence: CI run `32876632234` — PASS.

## Hard constraints retained

- no undocumented/private ChatGPT endpoints
- no cookie/session reuse
- no automated/programmatic extraction of ChatGPT data/output
- no history crawling
- no provider DOM scraping
- no protection/rate-limit bypass
- provider interaction is URL-only and origin-scoped
- canonical workspace state remains extension-owned `chrome.storage.local`

## Product status

Chatspace is now a **daily-driver candidate** for its core local workflow: capture, organize, resume, and switch saved ChatGPT contexts while native ChatGPT remains the conversation runtime.

Graph, local notes, backup/recovery, optional Obsidian bridge, and deterministic local relationships remain secondary capabilities and do not sit on the critical capture/navigation path.

## Manual acceptance

Repository CI cannot perform the final live-browser visual/use acceptance. After merge, reload the unpacked extension and verify:

1. current ChatGPT conversation is detected without reloading the conversation tab manually
2. Save Conversation dialog accepts name/folder/pin
3. saved reference can be renamed/moved/pinned/deleted in Explorer
4. Home shows Continue/Pinned/Recent Notes after data exists
5. activating a saved chat tab switches native ChatGPT conversation

## Release status

This is a daily-driver candidate, not public store readiness. A committed npm lockfile and full public-distribution packaging/lifecycle checks remain separate release-hardening work.

## Next single priority

**Run the final PR #5 gate on this state commit, squash-merge if green, then perform live browser acceptance.**

## Blocked

No known code blocker. Live browser acceptance remains external to CI.
