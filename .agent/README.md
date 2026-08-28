# Chatspace Project Context Map

`AGENTS.md` is the canonical execution workflow for all coding agents.

This directory stores **project knowledge and detailed engineering policy**, not competing agent workflows.

Goal: make the minimum correct context easy to find while preserving requirements, architecture, design rationale and operational knowledge.

## Minimum-context routing

After reading `AGENTS.md`, read `.agent/STATE.md`, then only what the task needs:

| Need | Read |
|---|---|
| detailed engineering / Git / verification / release policy | `ENGINEERING.md` |
| product scope / requirements | `PRODUCT.md`, relevant `plans/` |
| architecture / persistence / provider boundaries | `ARCHITECTURE.md`, `SYSTEM.md` |
| code/domain conventions | `CODE_PATTERNS.md` |
| testing / acceptance rationale | `TESTING.md` |
| security / privacy / provider constraints | `SECURITY_COMPLIANCE.md` |
| delivery / product-convergence context | `DELIVERY.md` |
| UI / interaction | `DESIGN_SYSTEM.md` |
| task-specific playbook | `SKILLS.md` |
| durable technical/product decisions | `DECISIONS.md` |

Do not preload every document and do not begin ordinary work with a recursive repository scan.

## Information classes

Keep these concepts separate:

1. **Product knowledge** — requirements, user behavior, scope.
2. **Architecture knowledge** — runtime/data/trust boundaries and durable decisions.
3. **Operational knowledge** — current state, release/readiness constraints.
4. **Development workflow** — canonical lifecycle in `AGENTS.md`, detailed policy in `ENGINEERING.md`.
5. **Legacy workflow** — obsolete/duplicated process machinery that can be removed after validating dependencies.

Preserve 1-3 unless the underlying project decision is explicitly changed.

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

Completed plans may be marked completed or archived. `STATE.md` stays short because it is an operational snapshot, not the archive.

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
<tool-specific behavior only>
```

Never copy the canonical workflow into multiple agent-specific files.
