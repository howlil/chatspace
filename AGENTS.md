# Agent Instructions

This repository uses `.agents/` as the canonical project knowledge and active iteration state.

Before making a meaningful change, inspect the relevant canonical documents.

## Canonical Sources

- `.agents/PROJECT.md`
  Product intent, domain behavior, scope, contracts, ownership, non-goals, deferred work, and open validation.

- `.agents/ARCHITECTURE.md`
  System boundaries, module ownership, data flow, persistence, integrations, and architecture invariants.

- `.agents/CURRENT_ITERATION.md`
  Current milestone, active slice, completed work, evidence, blockers, and the single next action.

- `.agents/CODE_PATTERNS.md`
  Chatspace-specific implementation patterns, repository conventions, and known traps.

- `.agents/QUALITY.md`
  Verification strategy, test ownership, repository commands, CI gates, and release-ready confidence.

- `.agents/DECISIONS.md`
  Durable material decisions and rationale.

Optional project authorities used by Chatspace:

- `.agents/DESIGN.md`
  Side Panel interaction, visual hierarchy, responsive behavior, accessibility, and UI acceptance.

- `.agents/SECURITY.md`
  Provider, extension-permission, storage, rendering, filesystem, and localhost trust boundaries.

- `.agents/RELEASE.md`
  Chromium extension packaging, release states, browser acceptance, distribution, and rollback constraints.

Read only the documents relevant to the requested change, but always inspect `.agents/CURRENT_ITERATION.md` when continuing active work.

## Operating Rule

Follow the canonical engineering lifecycle and user authority model from the user's global SWE preferences.

Do not change product behavior, public/persisted contracts, architecture boundaries, data ownership, security/privacy/permission/trust boundaries, or other material decisions without explicit user approval.

Prefer the smallest coherent change that satisfies the approved requirement.

Do not create persistent task plans, sprint files, retrospective archives, status files, or additional `.agents/*.md` files unless the information has a durable project-level owner or the project genuinely requires an optional canonical document.

## Chatspace Material Boundaries

Treat these as material project boundaries and read the owning canonical document before changing them:

- native ChatGPT remains the provider-owned conversation runtime;
- Chatspace remains the extension-owned Side Panel workspace;
- provider integration remains validated URL/tab-only unless explicitly changed;
- `WorkspaceSnapshot` / extension-owned `chrome.storage.local` remains canonical workspace persistence;
- the direct local-vault directory handle remains integration-owned state outside `WorkspaceSnapshot`;
- Graph renderer/session state does not become canonical persistence implicitly;
- provider DOM/content access, new manifest permissions, destructive persisted-data changes, or expanded filesystem/localhost trust boundaries require explicit approval.

## Authority

When sources conflict, use this order:

```text
explicit current user instruction
-> PROJECT.md / approved material decisions
-> ARCHITECTURE.md / DESIGN.md / SECURITY.md
-> CURRENT_ITERATION.md
-> CODE_PATTERNS.md / QUALITY.md
-> current code and tests
-> historical PRs / stale documentation
```

If canonical documentation and current code disagree, determine which is stale and fix the inconsistency as part of the relevant bounded change. Do not silently invent a new product or architecture decision.
