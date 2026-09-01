# Chatspace Project Context Map

`AGENTS.md` is the canonical execution workflow for all coding agents.

This directory stores **project knowledge, active iteration state, and detailed engineering policy**, not competing agent workflows.

Goal: make the minimum correct context easy to find while preserving requirements, architecture, design rationale, operational knowledge, and resumable iteration state.

## Minimum-context routing

After reading `AGENTS.md`, read `.agent/CURRENT_ITERATION.md`, then only what the task needs:

| Need | Read |
|---|---|
| active milestone / current slice / next move | `CURRENT_ITERATION.md` |
| broader current project/operational state and historical convergence | `STATE.md` |
| detailed engineering / Git / verification / release policy | `ENGINEERING.md` |
| product scope / requirements | `PRODUCT.md`, relevant `plans/` |
| architecture / persistence / provider boundaries | `ARCHITECTURE.md`, `SYSTEM.md` |
| code/domain conventions | `CODE_PATTERNS.md` |
| testing / acceptance rationale | `TESTING.md` |
| security / privacy / provider constraints | `SECURITY_COMPLIANCE.md` |
| delivery / release-readiness context | `DELIVERY.md` |
| UI / interaction | `DESIGN_SYSTEM.md` |
| task-specific playbook | `SKILLS.md` |
| durable technical/product decisions | `DECISIONS.md` |

Do not preload every document and do not begin ordinary work with a recursive repository scan.

## Canonical active iteration source

`.agent/CURRENT_ITERATION.md` is the single source of truth for the currently active meaningful milestone/iteration.

It should answer, compactly:

```text
Feature Shape
Current Position
Delta
Next Move
```

and preserve enough execution state for another agent to resume without chat history:

- WHY / desired milestone outcome
- scope and non-goals
- ordered slices
- active slice
- completed slices
- evidence
- blockers/decisions
- milestone gate
- next meaningful action

Update it on meaningful state transitions, not after every edit or commit.

When there is no authorized active milestone, record that explicitly rather than inventing work.

## State separation

Keep these concepts separate:

1. **Product knowledge** — requirements, user behavior, scope.
2. **Architecture knowledge** — runtime/data/trust boundaries and durable decisions.
3. **Active iteration state** — current milestone, slice progress, evidence, next move in `CURRENT_ITERATION.md`.
4. **Broader operational/project state** — current delivered capability, release constraints, historical convergence in `STATE.md` / `DELIVERY.md`.
5. **Development workflow** — canonical milestone/continuous-delivery lifecycle in `AGENTS.md`, detailed policy in `ENGINEERING.md`.
6. **Legacy workflow** — obsolete/duplicated process machinery that can be removed after validating dependencies.

`STATE.md` may contain historical workflow wording from prior delivery eras. Where it conflicts with `AGENTS.md` or `CURRENT_ITERATION.md`, those two canonical files win; preserve the project/history content rather than deleting it merely to clean process wording.

## Planning rule

Plan at milestone boundaries, not every slice.

Use this hierarchy:

```text
Milestone -> Slice -> Logical Change -> Commit
```

- milestone = bounded meaningful outcome worth planning as a whole
- slice = coherent vertical progress step
- logical change = integration/review unit
- commit = checkpoint

Do not create a new plan document simply because another slice starts. A plan under `plans/` is useful only when it preserves meaningful requirement/design rationale beyond the compact active state.

## Project-knowledge preservation rule

Workflow cleanup may remove obsolete process/orchestration documents. It must **never** remove project knowledge merely because it is old or completed.

Preserve:

- requirements and acceptance criteria
- architecture/system detail and constraints
- design-system and UX decisions
- security/privacy/compliance constraints
- testing strategy, fixtures rationale and regression knowledge
- delivery/product-convergence history
- project plans, requirement notes and design rationale
- durable decisions and migration context

Completed plans may be marked completed or archived. `CURRENT_ITERATION.md` stays compact because it is an execution snapshot, not the archive.

## Documentation rule

Prefer a few authoritative documents over many overlapping documents.

Before creating a new document, ask:

```text
Does an existing authoritative document own this knowledge?
Will this reduce future discovery/rework cost?
Will it become stale independently?
```

If the first answer is yes, update the existing owner instead of creating another file.

## Agent adapters

There are currently no separate full Claude/Copilot/Codex workflows in this repository. If an agent-specific file is added later, it should conceptually contain only:

```text
Follow /AGENTS.md.
Read /.agent/CURRENT_ITERATION.md for active work.
<tool-specific behavior only>
```

Never copy the canonical workflow into multiple agent-specific files.
