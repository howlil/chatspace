# Lean Task Playbooks

These are execution playbooks only. They do not replace project requirements, architecture, testing, security, design, delivery or plan documents.

## Feature

1. Read existing requirement/project context.
2. State Problem / Acceptance / Non-goals / Risk / Evidence.
3. Choose the thinnest vertical slice.
4. RED owned behavior when feasible.
5. Implement minimum GREEN change.
6. Refactor touched complexity only.
7. Focused checks -> full gate.
8. One PR for the outcome; stop when acceptance passes.

## Bug

```text
symptom -> reproduce -> observe boundary/state -> one falsifiable hypothesis
-> regression test -> minimal fix -> affected checks -> full gate
```

Three failed fixes trigger model reassessment.

## Refactor

Require a named maintenance problem: defect-prone duplication, mixed responsibility, boundary leakage, difficult testing, or verified dead code. Preserve behavior and keep scope bounded. Prefer deletion/simplification over new layers.

## Legacy cleanup

1. Identify candidate code/process path.
2. Search consumers/references.
3. Prove replacement or removal from product scope.
4. Delete only obsolete implementation/process artifacts.
5. Preserve requirements, architecture, plans and rationale.
6. Run full gate.

## Architecture

Use only for a real boundary change. Start from the existing `ARCHITECTURE.md`; never replace detailed project architecture with a generic redesign.

## UI

Read `DESIGN_SYSTEM.md`. Start from hierarchy/task flow, reuse existing tokens/primitives, test changed interaction/accessibility behavior, and check narrow side-panel layout.

## Provider / security

Read `SECURITY_COMPLIANCE.md`; minimize permissions/capability, validate boundary inputs, preserve local-workspace degradation, and reject unsupported/private provider mechanisms.

## Spike

State Question / Cheapest experiment / Stop condition / Evidence / Decision. Preserve useful requirement/design findings in the project docs or plan rather than deleting the knowledge with spike code.

## Release

Follow `ENGINEERING.md` for the release mechanism and `DELIVERY.md` for Chatspace-specific readiness requirements.
