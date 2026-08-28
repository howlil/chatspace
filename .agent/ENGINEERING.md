# Lean Engineering Policy

`AGENTS.md` is the single canonical product/engineering lifecycle. This file provides detailed engineering policy only; it must not redefine the lifecycle or product authority.

## 1. Engineering economics

Optimize for:

```text
Value Delivered / (Engineering Time + Waiting + Rework + Cognitive Load + Compute Cost + Agent Context Cost)
```

Speed comes primarily from small batches, low WIP, low rework, clear boundaries, and fast feedback. Never trade correctness/security for superficial coding speed.

Testing/checking cost is engineering cost. Verification depth is justified only by meaningful risk plus repository-required quality gates.

## 2. Requirement handling

Follow `AGENTS.md` for USER INTENT → UNDERSTAND → BOUND → SPECIFY.

For a bounded implementation task, the working summary should normally fit in:

```text
Problem:
Explicit requirement:
Expected outcome:
Acceptance: 1-3 observable outcomes
Non-goals:
Risk:
Evidence:
```

Separate a proposed solution from the underlying requirement. A proposed solution can be evaluated technically; it is not permission to invent adjacent product behavior.

The agent may draft acceptance criteria when they directly restate explicit requirements or existing approved behavior. Material product semantics remain user-owned.

Do not turn requirement intake into mandatory broad discovery, bottleneck analysis, P0/P1 inventory, metrics work, or a giant plan for ordinary bounded changes.

## 3. Local engineering autonomy

Within approved scope and current material boundaries, execute ordinary local engineering choices without approval loops.

Examples:

- implementation order
- naming/file placement consistent with repository patterns
- local component/function structure
- reuse/extension of an existing owner
- small local abstraction justified by current behavior
- touched-only refactor
- verification boundary selection

Escalate only when the material approval boundaries in `AGENTS.md` or `.agent/SYSTEM.md` are crossed.

## 4. Small-batch implementation

Use the thinnest vertical slice that proves the approved outcome.

Typical implementation loop inside the canonical lifecycle:

```text
specify / reproduce
-> choose verification boundary
-> RED only when useful
-> minimum change
-> touched-only refactor when useful
-> targeted verification
```

Do not introduce architecture-first scaffolding, feature bundles, broad rewrites, or “while here” cleanup.

## 5. Verification economics

`.agent/TESTING.md` is the detailed verification authority.

For every change:

1. identify realistic failure
2. estimate impact + likelihood
3. choose cheapest high-signal evidence
4. broaden only when risk requires it
5. satisfy repository-required quality gates before merge

Local fast feedback and merge gates are different concerns. Do not reproduce the full CI gate after every edit, but do not waive required CI/quality gates because a local change seems low-risk.

No arbitrary coverage target. Flaky tests are defects because they lower signal.

## 6. Git and WIP strategy

`master` is the integration branch and should stay releasable.

Branches:

- `feat/<outcome>`
- `fix/<defect>`
- `refactor/<bounded-area>`
- `chore/<maintenance-outcome>`
- `spike/<question>`

Rules:

- one logical outcome = one branch + one PR
- branch from current `master`
- keep branches short-lived
- keep concurrent WIP low
- avoid stacked PRs unless a dependency makes them necessary
- never branch per file/layer/agent/micro-task
- no unrelated cleanup in a feature/fix PR
- commits are checkpoints; PR is the review unit
- prefer squash merge
- recheck after meaningful base movement
- parallelize only genuinely independent work with stable contracts

A PR should communicate: Why, What, Non-goals, Risk, Verification.

## 7. Code and abstraction rule

Use `.agent/CODE_PATTERNS.md` for project conventions and `.agent/SYSTEM.md` for design decisions.

Do not add an interface, factory, registry, base class, store, service, framework, cache, worker, event bus, DI container, plugin mechanism, or other abstraction solely for future flexibility.

Prefer:

```text
reuse existing pattern
-> extend existing owner
-> small local abstraction
-> architecture change only when necessary
```

Extract when there is current evidence of:

- a stable repeated pattern
- a real external/trust boundary
- defect-prone duplicated knowledge
- independently changing responsibility
- measured performance constraint

A dependency must solve a current problem and materially beat platform/native code on correctness, security, maintenance, or delivery cost.

Preserve boundaries that already provide domain isolation, failure isolation, security, ownership clarity, or testability.

## 8. Agent context and token discipline

Default context:

```text
AGENTS.md + STATE.md + affected code/tests + task-relevant project docs only
```

Treat these as waste unless evidence says otherwise:

- recursive repo scans for bounded work
- preloading all `.agent` docs
- repeated architecture analysis for ordinary local changes
- mandatory bottleneck analysis before ordinary coding
- large speculative plans
- repeated full verification during the local loop
- duplicate tests/checks for the same failure
- duplicate workflow/status documents
- tightly coupled parallel-agent work
- continuing after acceptance is satisfied

Reuse known project state rather than rediscovering it.

## 9. Delivery measurement

Metrics are diagnostic tools, not mandatory deliverables for every task.

Where existing evidence supports a real delivery decision, useful signals may include:

### Delivery / DORA

- deployment frequency
- change lead time
- change failure rate
- failed-deployment recovery time

### Flow

- PR/cycle time
- waiting/review time
- CI duration/queue time
- batch size
- WIP
- rework caused by acceptance failure

### Agent / DevEx

- repeated context discovery
- repeated broad verification
- avoidable replanning
- conflicting instructions
- unnecessary handoffs
- low-value test maintenance

Do not fabricate telemetry. Do not build a metrics platform unless a concrete decision is blocked without it.

## 10. Legacy cleanup

“Legacy” means obsolete implementation or obsolete workflow machinery, not old project knowledge.

Deletion requires evidence such as:

- no active runtime/import/entrypoint/route consumer
- replacement behavior is active
- capability is explicitly removed from product scope
- config/script exists only for a removed path

When dead, remove the obsolete ownership slice rather than leaving commented copies or compatibility wrappers.

Never delete as legacy:

- requirements / acceptance criteria
- architecture/system documentation
- plans / rationale
- security/compliance constraints
- testing strategy/rationale
- delivery/product-convergence context
- durable decisions

Mark durable knowledge completed/superseded/historical instead.

## 11. Review order

Review in this order:

1. approved acceptance correctness
2. unintended product/scope growth
3. material boundary changes
4. failure/security/data behavior
5. sufficiency and non-duplication of verification
6. simplicity/maintainability
7. measured performance when relevant
8. style

Do not block delivery on subjective style or tests that protect no realistic failure.

Three failed implementation attempts without a stronger hypothesis trigger root-cause/model reassessment rather than a fourth blind patch.

## 12. Release strategy

Development merges do not automatically become public releases. `master` stays releasable; distribute the smallest coherent accepted increment.

Pre-1.0:

- `0.x.y`: bugfix/reliability/internal change
- `0.x.0`: coherent backward-compatible capability or intentional persisted-schema evolution
- `1.0.0`: core workflow, recovery/upgrades, permissions/privacy, and distribution lifecycle are stable

```text
accepted feature/fix
-> merge to releasable master
-> release-candidate decision
-> release-specific verification when needed
-> tiny release-only change if version/release notes are required
-> tag exact accepted commit
-> package from the accepted source/tag
```

No long-lived release branch. No feature expansion inside a release-only change.

Before release, decide whether product instrumentation is actually needed to evaluate the expected outcome. It is not mandatory by default.

Rollback before public distribution: revert the bounded merge and rebuild the last accepted tag. Persisted-schema changes must define migration/rollback safety in the change itself.

## 13. Definition of done

Engineering completion means:

- approved observable acceptance passes
- realistic affected risks were identified
- sufficient high-signal evidence exists
- repository-required quality gates pass
- required environment-specific/manual acceptance is recorded only when applicable
- diff contains only intended scope
- changed operational state/docs are current

Then follow the STOP rule in `AGENTS.md`.
