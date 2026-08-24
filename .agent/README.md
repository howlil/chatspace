# Chatspace Agent Operating Model

This directory is the source of truth for how agents plan, implement, review, and deliver Chatspace.

The goal is not to maximize agent activity. The goal is to maximize **validated product progress per unit of change**.

## 1. Product posture

Chatspace is an Obsidian/IDE-inspired workspace layer for long-form AI conversations. The intended experience is spatial rather than feed-like:

```text
┌────────────────┬──────────────────────────────┬────────────────────┐
│ Workspace Tree │ Main Workspace               │ AI Conversation    │
│                │                              │                    │
│ folders        │ note / graph / outline       │ provider-owned UI  │
│ chats          │ tabs / split panes           │ or supported bridge│
│ pinned         │                              │                    │
└────────────────┴──────────────────────────────┴────────────────────┘
```

Chatspace owns organization, navigation, local metadata, spatial views, notes, and graph projections. Provider internals remain outside our ownership boundary.

## 2. Read order

Every agent starts with:

1. `../AGENTS.md`
2. `README.md` (this file)
3. `PRODUCT.md`
4. `ARCHITECTURE.md`
5. `WORKFLOW.md`
6. Then only the task-relevant docs below.

| Task | Read next |
|---|---|
| feature implementation | `CODE_PATTERNS.md`, `TESTING.md`, `QUALITY_GATES.md`, `skills/feature-delivery.md` |
| UI/UX | `DESIGN_SYSTEM.md`, `skills/ui-design.md` |
| ChatGPT/web compatibility | `SECURITY_COMPLIANCE.md`, `skills/chatgpt-compatibility.md` |
| bug | `skills/debugging.md`, `TESTING.md` |
| refactor | `CODE_PATTERNS.md`, `skills/refactor.md` |
| release | `DELIVERY.md`, `QUALITY_GATES.md`, `skills/release.md` |
| research/spike | `skills/research.md` |
| multi-agent work | `AGENT_ROLES.md` |

Do not load every document by default. Progressive context is deliberate.

## 3. Engineering principles

Priority order:

1. Correct behavior
2. User value
3. Fast feedback
4. Maintainability
5. Performance where measured
6. Extensibility where justified

Default rules:

- **KISS:** use the smallest design that preserves clear boundaries.
- **YAGNI:** no abstraction for hypothetical providers/features.
- **DRY carefully:** duplication is cheaper than the wrong abstraction; extract only after a stable pattern appears.
- **SOLID pragmatically:** boundaries and dependency direction matter more than class-heavy architecture.
- **Functional core, imperative shell** where useful: pure transforms for tree/graph/state; effects at adapters.
- Prefer feature-oriented modules over layer-oriented mega-folders.
- Prefer explicit data contracts over implicit DOM assumptions.
- Prefer deterministic state transitions over scattered component-local side effects.
- Prefer local-first metadata; collect the minimum necessary data.

## 4. Delivery doctrine

A task is not "make progress on X." A task must produce one reviewable, testable behavior.

```text
Intent
  ↓
Classify task
  ↓
Inspect current state
  ↓
Define acceptance criteria
  ↓
RED test
  ↓
Verify RED
  ↓
Minimal implementation
  ↓
Verify GREEN
  ↓
Refactor while green
  ↓
Full quality gate
  ↓
Small PR / squash merge
  ↓
Update STATE.md
```

Target behavior:

- feature branches short-lived
- one user-visible outcome per PR where practical
- no cleanup bundled into unrelated feature PRs
- no waiting branch with speculative work stacked behind it
- unblock integration before polishing secondary concerns

## 5. Task classification

### Spike

Use when feasibility is unknown. Output is evidence and a recommendation, not production code.

### Bounded

Existing flow, one contained behavior, known boundaries. Use a short in-task design and implement via TDD.

### Architectural

New subsystem, changed dependency boundary, new persistence model, provider adapter redesign, or cross-cutting UI model. Write a design first and decompose into independently shippable increments.

Hidden complexity upgrades the task classification; it never downgrades it.

## 6. Definition of ready

Implementation may start only when the agent can state:

- user/problem being solved
- observable acceptance criteria
- scope and non-scope
- touched boundaries/files
- test strategy
- risks/compatibility implications

If these cannot be stated from available context, perform a bounded research spike before production work.

## 7. Definition of done

A feature is done only when all applicable items are evidenced:

- acceptance criteria pass
- required unit/component/contract tests pass
- build/typecheck/lint pass
- no unexpected console errors
- permissions/security impact reviewed
- keyboard and narrow-layout behavior checked for UI work
- ChatGPT compatibility fixture/adapter contract passes when affected
- docs/state updated
- no hidden TODO/TBD placeholders
- PR diff contains only intended scope

Never claim completion from inspection alone.

## 8. Project documents

- `PRODUCT.md` — product model, scope, metrics, roadmap constraints
- `ARCHITECTURE.md` — runtime, boundaries, data flow, persistence
- `CODE_PATTERNS.md` — implementation conventions
- `DESIGN_SYSTEM.md` — visual/interaction rules
- `WORKFLOW.md` — iteration and git workflow
- `DELIVERY.md` — staged delivery plan
- `TESTING.md` — test pyramid and browser-extension strategy
- `SECURITY_COMPLIANCE.md` — trust boundaries and policy constraints
- `QUALITY_GATES.md` — merge/release gates
- `AGENT_ROLES.md` — role decomposition and parallelism rules
- `DECISIONS.md` — compact architecture decision log
- `STATE.md` — current/next/blockers; update after meaningful increments
- `skills/` — executable task playbooks

## 9. Current product constraint

Chatspace must not become an undocumented ChatGPT client. Do not implement:

- private/undocumented ChatGPT network calls
- cookie/session-token reuse
- rate-limit/protection bypass
- reverse engineering provider internals
- background bulk extraction of conversations or outputs
- automated extraction/scraping of ChatGPT data/output

Provider-specific capabilities must be capability-gated and policy-compliant. The architecture should remain useful even if a provider integration is reduced to navigation, explicit user actions, official exports, or an official API/SDK later.
