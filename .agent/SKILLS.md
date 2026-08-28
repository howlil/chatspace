# Lean Task Playbooks

These are task-specific implementation notes only. They do not replace the canonical lifecycle in `AGENTS.md` or redefine product, architecture, testing, security, design, delivery, or release policy.

For every task, follow `AGENTS.md` first.

## Feature

- start from the approved requirement and expected outcome
- bound the smallest observable vertical slice
- reuse the current owner/pattern before adding design
- choose verification from realistic risk
- implement the minimum complete change
- satisfy repository-required quality gates before merge
- stop when accepted scope is complete

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
-> stop
```

A regression test is preferred when it is the cheapest deterministic protection against a realistic repeat failure; it is not mandatory for every defect.

Three failed fixes without a stronger hypothesis trigger model reassessment.

## Refactor

Require a named current maintenance problem, such as:

- defect-prone duplication
- mixed responsibility
- boundary leakage
- difficult verification
- verified dead code

Preserve behavior and keep scope bounded. Prefer simplification over new layers. Verify the realistic behavior risk rather than running broader checks by habit.

## Legacy cleanup

1. identify the candidate obsolete code/process path
2. inspect the minimum references/owners needed to prove whether it is active
3. prove replacement or removal from current product scope
4. delete only obsolete implementation/process artifacts
5. preserve requirements, architecture, plans/rationale, testing/security knowledge, and durable decisions
6. choose verification according to what deletion could realistically break
7. satisfy required repository quality gates

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

## Release

Follow `ENGINEERING.md` for repository release mechanics and `DELIVERY.md` for Chatspace-specific readiness.

Use release-specific verification only for a real release candidate or when the affected risk itself requires it.
