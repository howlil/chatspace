# Lean Task Playbooks

These are task-specific implementation notes only. They do not replace the canonical delivery contract in `AGENTS.md` or redefine product, architecture, testing, security, design, delivery, or release policy.

For every task, follow `AGENTS.md` first and read `.agent/CURRENT_ITERATION.md` for the current milestone position.

## Milestone planning

Use when a meaningful product/engineering/reliability/migration/release outcome is large enough to contain multiple coherent slices.

Plan once at the milestone boundary:

```text
WHY / desired outcome
In scope:
Non-goals:
Material constraints/boundaries:
Milestone acceptance:
Slices:
Known risks/blockers:
Milestone gate:
```

Rules:

- milestone planning sets the horizon; it does not increase integration batch size
- execute planned slices continuously without reopening full planning every time
- update the plan only when evidence or an explicit user decision materially changes scope/boundaries/order
- do not invent additional slices because they seem useful

## Feature Compass

Use as an orientation layer, especially when work spans several slices.

Keep the current view compact:

```text
Feature Shape:
Current Position:
Delta:
Next Move:
```

`CURRENT_ITERATION.md` should make it possible to answer what the feature/outcome will look like, what is changing, what is already done, what is active, and the single next meaningful action without reconstructing chat history.

Do not repeat the entire specification or project history unless needed.

## Feature / product slice

- start from the approved milestone outcome and explicit slice requirement
- bound the smallest observable vertical delta
- reuse the current owner/pattern before adding design
- choose verification from realistic risk
- implement the minimum coherent logical change(s)
- integrate each verified logical change rather than batching the whole milestone
- satisfy repository-required quality gates where applicable
- update `CURRENT_ITERATION.md` when the slice meaningfully advances
- stop at the slice boundary and continue to the next planned slice without a new planning ceremony

Do not add adjacent product behavior or require RED/TDD when another verification method is cheaper and equally reliable.

## Bug

```text
symptom
-> reproduce/observe at the cheapest useful boundary
-> one falsifiable root-cause hypothesis
-> choose regression protection only if it has durable value
-> minimal fix
-> risk-appropriate verification
-> required quality gates
-> integrate
```

A regression test is preferred when it is the cheapest deterministic protection against a realistic repeat failure; it is not mandatory for every defect.

Three failed fixes without a stronger hypothesis trigger model reassessment.

If the bug belongs to an active milestone, treat the fix as the smallest necessary logical change inside that milestone rather than opening a new planning cycle.

## Refactor

Require a named current maintenance problem, such as:

- defect-prone duplication
- mixed responsibility
- boundary leakage
- difficult verification
- verified dead code

Preserve behavior and keep scope bounded. Prefer simplification over new layers. Verify the realistic behavior risk rather than running broader checks by habit.

A tiny refactor does not become a product feature, milestone, or branch merely because code changed.

## Legacy cleanup

1. identify the candidate obsolete code/process path
2. inspect the minimum references/owners needed to prove whether it is active
3. prove replacement or removal from current product scope
4. delete only obsolete implementation/process artifacts
5. preserve requirements, architecture, plans/rationale, testing/security knowledge, and durable decisions
6. choose verification according to what deletion could realistically break
7. satisfy required repository quality gates
8. integrate as a bounded logical change

Do not perform a mandatory repo-wide audit or full gate solely because the task is called legacy cleanup.

## Architecture

Use only when the current requirement actually crosses a durable design boundary. Follow `.agent/SYSTEM.md` and start from current `ARCHITECTURE.md`.

Ordinary local implementation design does not require an architecture ceremony or approval loop.

## UI

Read `DESIGN_SYSTEM.md` when the task touches UI/interaction. Start from the requested behavior, reuse existing tokens/primitives, and verify the changed interaction/layout/accessibility risk at the cheapest reliable boundary.

Presentation-only changes do not require automated tests by default.

## Provider / security

Read `SECURITY_COMPLIANCE.md`. Keep the provider boundary narrow, validate external inputs, preserve local-workspace degradation, and reject private/unsupported provider mechanisms.

Changes to trust, permission, privacy, or provider ownership boundaries require explicit approval.

## Spike

State only:

```text
Question:
Cheapest experiment:
Stop condition:
Evidence:
Decision needed:
```

A spike answers a concrete uncertainty; it does not become permission for product scope expansion. Preserve durable findings in the owning project document.

## Milestone gate

Run after planned slices are complete, not after every slice.

Check milestone acceptance, integrated slice status, material blockers, required gates, relevant state/docs, and release-specific evidence only where actually needed.

If something is missing, identify the smallest missing slice or decision instead of restarting the plan.

## Retrospective

Use only when justified by a completed meaningful milestone/release, material delay/rework/failure, repeated friction, or explicit user request.

```text
Evidence -> Bottleneck -> Root Cause -> Small Improvement -> Verify
```

Evidence may include requirement churn, batch/diff size, PR/review loops, failed tests/CI/builds, production defects, repeated debugging, unnecessary files/abstractions/dependencies, waiting/blocking, agent/tool loops, context waste, duplicated work, or user corrections.

Choose the smallest improvement with a measurable expected effect. Do not produce a ceremonial status report or a broad improvement backlog.

## Release

Follow `ENGINEERING.md` for repository release mechanics and `DELIVERY.md` for Chatspace-specific readiness.

Use release-specific verification only for a real release candidate or when the affected risk itself requires it.
