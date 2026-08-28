# System Design Decision Rules

`AGENTS.md` is the canonical lifecycle. `ARCHITECTURE.md` contains the current Chatspace architecture. This file defines only how to make design decisions without overengineering or silently changing material boundaries.

## 1. Default

Use the existing architecture and ownership boundaries for ordinary work.

Before introducing a design change, answer:

1. What behavior must change?
2. Which existing component/module owns that behavior?
3. Can the requirement be satisfied using the current architecture and patterns?
4. What is the smallest design with the lowest justified blast radius?

Prefer, in order:

```text
reuse existing pattern
-> extend existing owner/component
-> introduce a small local abstraction
-> change architecture only when current architecture cannot reasonably satisfy the requirement
```

When multiple designs are valid, prefer:

- lower coupling
- smaller change surface
- fewer new dependencies
- fewer new abstractions
- lower migration cost
- easier reversibility
- clearer state/data ownership

Do not introduce architecture for hypothetical scale, reuse, flexibility, or future requirements.

## 2. Local autonomy vs material approval

The agent may make ordinary local design decisions autonomously within approved scope and current boundaries.

Explicit user approval is required before materially changing:

- service/runtime boundaries
- data ownership
- public/user-visible or persisted contracts
- communication patterns between major components/services
- consistency model
- security/privacy/permission/trust boundaries
- infrastructure architecture
- destructive or irreversible data behavior
- another major cross-cutting architecture boundary

A new interface or local abstraction by itself does not require approval when it stays inside existing boundaries and is the smallest justified implementation choice.

## 3. Architecture-change trigger

A durable architecture decision is justified only when the current requirement actually introduces or changes something such as:

- persistence schema or migration strategy
- trust/external integration boundary
- long-lived runtime/background process
- cross-feature shared-state owner
- provider ownership/compliance boundary
- dependency direction across multiple features
- one of the material approval boundaries above

Otherwise use a compact local design and implement the vertical slice.

## 4. Material design record

When a material architecture change is approved, record only what is needed:

```text
Requirement / current constraint:
Why existing design cannot reasonably satisfy it:
Smallest approved architecture change:
State/data ownership:
Public/compatibility impact:
Failure/security implications:
Migration/reversibility:
```

Update `ARCHITECTURE.md` and `DECISIONS.md` only when the actual durable architecture changes.

## 5. Project-specific constraints

- preserve provider-independent local workspace behavior
- keep canonical state ownership explicit
- keep provider/external integration assumptions behind narrow boundaries
- measure before adding caching, workers, virtualization, polling, indexing, or concurrency machinery
- prefer deletion/simplification over another compatibility layer when an old path is proven dead
- preserve historical architecture context by marking decisions superseded rather than erasing why they existed
