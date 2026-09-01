# Agent Instructions

This repository uses root `AGENTS.md` as the thin agent entrypoint and `.agents/` as the canonical project knowledge + active engineering state.

## Canonical Sources

- `.agents/PROJECT.md` — WHY + WHAT: product intent, behavior, scope, contracts, ownership, constraints, non-goals, deferred/open decisions.
- `.agents/ARCHITECTURE.md` — WHERE + HOW boundaries interact: responsibility placement, module/data/trust/infrastructure boundaries, major flows, invariants.
- `.agents/CURRENT_ITERATION.md` — NOW + NEXT: current milestone, active slice, completed work, evidence, blockers, next action.
- `.agents/CODE_PATTERNS.md` — Chatspace-specific implementation conventions, ownership patterns, commands, and known traps.
- `.agents/QUALITY.md` — Chatspace-specific verification strategy, required checks, CI gates, release confidence, and evidence requirements.
- `.agents/DECISIONS.md` — durable material decisions and rationale.

`DESIGN.md` is the separate root-level durable product-experience and visual-design authority. Read it for UI/UX, interaction, responsive, accessibility, visual-language, token, component-styling, and theme work.

Read only the documents relevant to the requested change. Always inspect `.agents/CURRENT_ITERATION.md` when continuing active work.

## Operating Rule

Follow the user's canonical global SWE rules. Do not duplicate the global lifecycle, Product Authority, Minimum Change, Design Decision Rule, Feature Compass, milestone delivery, retrospective method, generic testing rules, Git rules, dependency rules, or generic documentation rules inside this repository.

Repository documents define only how Chatspace itself works and any explicit project-specific override.

Do not change product behavior, public/persisted contracts, architecture/data ownership, security/privacy/permission/trust boundaries, or other material decisions without explicit user approval.

Prefer the smallest coherent change. Do not create persistent sprint/task plans, retrospective archives, status files, workflow-rule files, or additional `.agents/*.md` authorities.

## Material Chatspace Boundaries

Before changing these, read the owning canonical document and obtain approval where required:

- native ChatGPT remains the provider-owned conversation runtime;
- Chatspace remains the extension-owned Side Panel workspace;
- provider integration is validated URL/tab-only;
- `WorkspaceSnapshot` in extension-owned `chrome.storage.local` is canonical workspace persistence;
- the selected local-vault directory handle remains integration-owned state outside `WorkspaceSnapshot`;
- Graph renderer/session state does not become canonical persistence implicitly;
- provider DOM/content access, new privileged permissions, destructive persisted-data behavior, or expanded filesystem/localhost trust boundaries are material changes.

## Authority Order

```text
explicit current user instruction
-> .agents/PROJECT.md / approved material decisions
-> .agents/ARCHITECTURE.md / DESIGN.md
-> .agents/CURRENT_ITERATION.md
-> .agents/CODE_PATTERNS.md / .agents/QUALITY.md
-> current code and tests
-> historical PRs / stale documentation
```

If code and canonical documentation disagree, determine which is stale and correct the inconsistency without inventing a new product or architecture decision.
