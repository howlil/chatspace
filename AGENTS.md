# Agent Instructions

This repository uses root `AGENTS.md` as the thin agent entrypoint and `.agents/` as the canonical project knowledge + active engineering state. Repository execution must be resumable from these files plus current code/tests; do not depend on chat history or hidden planning state.

## Canonical Sources

- `.agents/PROJECT.md` — WHY + WHAT: product purpose, core user journey, capability map, committed behavior, scope, contracts, ownership, constraints, non-goals, deferred/open decisions.
- `.agents/ARCHITECTURE.md` — WHERE + HOW boundaries interact: responsibility placement, module/data/trust/infrastructure boundaries, major flows, invariants.
- `.agents/CURRENT_ITERATION.md` — NOW + NEXT: current milestone outcome, active slice/logical change when present, completed evidence, blockers, and next meaningful action.
- `.agents/CODE_PATTERNS.md` — Chatspace-specific implementation conventions, ownership patterns, commands, and known traps.
- `.agents/QUALITY.md` — Chatspace-specific risk-based verification strategy, CI gates, release confidence, and evidence requirements.
- `.agents/DECISIONS.md` — durable material decisions and rationale.

`DESIGN.md` is the separate root-level durable product-experience and visual-design authority. Read it for UI/UX, interaction, responsive, accessibility, visual-language, token, component-styling, and theme work.

Read only the documents relevant to the requested change. Always inspect `.agents/CURRENT_ITERATION.md` when continuing active work.

## Operating Rule

Optimize for meaningful integrated product capability, correctness, maintainability, and short user-outcome lead time. Do not optimize for milestone count, PR count, tiny diffs, isolated layer completion, or verification ceremony.

Use this decomposition when planning or continuing product work:

```text
PRODUCT PURPOSE
-> CORE USER JOURNEY
-> CAPABILITY MAP
-> MILESTONE
-> SLICE
-> LOGICAL CHANGE
-> TASK
```

Definitions:

- **Milestone** — the smallest coherent product scope that delivers one meaningful integrated user capability or workflow end-to-end.
- **Slice** — the smallest demonstrable vertical behavior/scenario that materially advances the milestone outcome.
- **Logical Change** — a coherent technical modification required to realize a slice.
- **Task** — a concrete implementation action inside a logical change.
- Engineering enablers, migrations, reliability work, infrastructure changes, and bug fixes stay classified as such unless they independently deliver a product capability.

Before proposing a new milestone, reconstruct the relevant core user journey and capability gap from `.agents/PROJECT.md` plus current code/evidence. Prefer the highest-value missing core behavior; do not promote nice-to-have polish or isolated technical work into a product milestone.

Prefer the smallest coherent vertical change that preserves the intended user outcome. Do not create persistent sprint/task plans, retrospective archives, status files, workflow-rule files, or additional `.agents/*.md` authorities.

## Authority and autonomy

The user owns product purpose, observable product behavior, scope, acceptance criteria, material architecture boundaries, public/persisted contracts, data ownership, and security/privacy/permission/trust boundaries.

The implementing agent owns repository inspection, local implementation design inside approved boundaries, coding, focused refactoring required by the change, testing, debugging, verification, and implementation-level decisions.

Use this design preference order for implementation choices:

```text
reuse existing owner/pattern
-> extend existing owner/pattern
-> small local abstraction
-> new component/module
-> architecture change
```

Do not introduce unrelated refactors, speculative abstractions, future-proofing, dependency upgrades, or scope expansion. A material contract/boundary change requires explicit approval before implementation.

Stop and surface the decision instead of guessing when the requested work requires a contradictory product rule, destructive migration, public/persisted contract change, security/trust-boundary change, or major architecture change that has not already been approved.

## Verification Rule

Verification is proportional to changed risk and remains repository-owned.

- use static checks for syntax/type/style risks;
- use focused deterministic tests for owned logic and observable behavior;
- use integration tests when behavior crosses real repository-owned boundaries that isolated tests cannot establish;
- use the repository CI gate for integration confidence before merge/release-ready state.

Black-box/live-browser testing is not a required verification layer or milestone completion gate. Do not create synthetic browser suites merely to imitate Chromium runtime behavior.

Do not add higher-cost verification layers merely because they exist. Do not weaken or skip a relevant existing deterministic gate to manufacture green status.

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
