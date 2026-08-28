# System Design Decision Rules

`ARCHITECTURE.md` contains the detailed current Chatspace architecture and must be preserved. This file only defines **how to evolve that architecture without overengineering**.

## Default

Use the existing architecture and boundaries. Do not redesign the system for ordinary feature work.

A new durable system-design decision is justified only when a change introduces at least one of:

- a new persistence schema or migration strategy
- a new trust/external integration boundary
- a new long-lived runtime/background process
- a new cross-feature shared-state owner
- a changed provider ownership/compliance boundary
- a dependency-direction change affecting multiple features

Otherwise use a compact in-task design and implement a vertical slice.

## Design test

Before adding architecture, answer:

```text
Current constraint:
Why existing design is insufficient:
Smallest change that satisfies it:
New state/data ownership:
Failure mode:
Security/trust impact:
How this ships as an independent vertical slice:
```

If the first two answers are weak, do not create the abstraction.

## Rules

- preserve provider-independent local workspace behavior
- keep canonical state ownership explicit
- keep provider and external integration assumptions behind boundaries
- measure before adding caching, workers, virtualization, polling, indexing or concurrency machinery
- prefer deletion/simplification over another compatibility layer when the old path is truly dead
- update `ARCHITECTURE.md`/`DECISIONS.md` when the actual project architecture changes; never replace those project details with generic rules
