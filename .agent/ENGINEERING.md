# Lean Engineering Policy

`AGENTS.md` is the single canonical product/engineering delivery contract. This file provides detailed engineering policy only; it must not redefine product authority or create a competing lifecycle.

## 1. Engineering economics

Optimize for:

```text
Value Delivered / (Engineering Time + Waiting + Rework + Cognitive Load + Compute Cost + Agent Context Cost)
```

Speed comes from small batches, low WIP, clear boundaries, fast feedback, continuous integration of verified logical changes, and avoiding unnecessary planning/branch churn. Never trade correctness or security for superficial coding speed.

## 2. Delivery model

Use the hierarchy:

```text
Milestone -> Slice -> Logical Change -> Commit
```

Plan the milestone once. Execute slices continuously. Integrate each coherent logical change when it is verified and required gates pass.

Do not create a fresh sprint plan, branch, PR, status document, or retrospective merely because the next slice starts.

Inside a slice, the working summary should normally fit in:

```text
Problem / approved requirement:
Expected slice outcome:
Acceptance: 1-3 observable outcomes
Non-goals:
Risk:
Evidence:
```

Do not turn requirement intake into mandatory broad discovery, bottleneck analysis, P0/P1 inventory, metrics work, or a giant plan for ordinary bounded work.

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
- normal commit decomposition

Escalate only when the material approval boundaries in `AGENTS.md` or `.agent/SYSTEM.md` are crossed.

## 4. Small-batch slice implementation

Use the thinnest vertical slice that advances the milestone and proves an observable delta.

Typical inner loop:

```text
specify / reproduce
-> choose verification boundary
-> RED only when useful
-> minimum change
-> touched-only refactor when useful
-> targeted verification
-> required gates
-> integrate logical change
```

Do not introduce architecture-first scaffolding, broad rewrites, horizontal layer batches, or “while here” cleanup.

A slice may contain multiple logical changes when that lowers risk and keeps integration small. A logical change may contain multiple commits. Do not force 1:1 relationships between slice, branch, PR, and commit.

## 5. Verification economics

`.agent/TESTING.md` is the detailed verification authority.

For every change:

1. identify realistic failure
2. estimate impact + likelihood
3. choose cheapest high-signal evidence
4. broaden only when risk requires it
5. satisfy repository-required quality gates before integration/merge where applicable

Local fast feedback and merge gates are different concerns. Do not reproduce the full CI gate after every edit, but do not waive required CI/quality gates because a local change seems low-risk.

No arbitrary coverage target. Flaky tests are defects because they lower signal.

## 6. Git, branches, PRs, and WIP

`master` is the integration branch and should stay releasable.

Branch and PR are delivery mechanisms, not planning hierarchy.

Rules:

- integrate at coherent logical-change boundaries
- keep concurrent WIP low
- keep branches short-lived when branches are used
- do not create a branch per file, layer, agent, micro-task, or every slice by default
- do not keep all milestone work in one giant long-lived branch
- one short-lived branch/PR may contain the commits needed for one coherent logical change
- use a branch/PR when repository policy, CI, review, risk, or collaboration makes it useful
- when safe direct integration is permitted, a tiny low-risk logical change does not require artificial branch churn
- avoid stacked PRs unless a dependency makes them necessary
- no unrelated cleanup in a product/fix change
- prefer squash merge for PR-based logical changes unless preserving commit history has concrete value
- recheck after meaningful base movement
- parallelize only genuinely independent work with stable contracts

When a PR is used, communicate compactly: Why, What, Non-goals, Risk, Verification.

Branch naming when useful:

- `feat/<outcome>`
- `fix/<defect>`
- `refactor/<bounded-area>`
- `chore/<maintenance-outcome>`
- `spike/<question>`

These are conventions, not a requirement to open a branch for every task.

## 7. Active iteration state

`.agent/CURRENT_ITERATION.md` is the canonical resumable execution state.

Update it only on meaningful transitions:

- milestone starts
- slice completes or active slice changes
- user materially changes scope/acceptance/boundaries
- new evidence changes the next move
- milestone becomes blocked/unblocked
- milestone gate completes

Do not log every commit or restate all project history.

The minimum orientation is:

```text
Feature Shape -> Current Position -> Delta -> Next Move
```

`.agent/STATE.md` remains broader project/operational history and does not own current iteration progress.

## 8. Code and abstraction rule

Use `.agent/CODE_PATTERNS.md` for project conventions and `.agent/SYSTEM.md` for design decisions.

Do not add an interface, factory, registry, base class, store, service, framework, cache, worker, event bus, DI container, plugin mechanism, or other abstraction solely for future flexibility.

Prefer:

```text
reuse existing pattern
-> extend existing owner
-> small local abstraction
-> new component when ownership requires it
-> architecture change only when necessary and approved
```

Extract when there is current evidence of:

- a stable repeated pattern
- a real external/trust boundary
- defect-prone duplicated knowledge
- independently changing responsibility
- measured performance constraint

A dependency must solve a current problem and materially beat platform/native code on correctness, security, maintenance, or delivery cost.

## 9. Agent context and token discipline

Default context:

```text
AGENTS.md + CURRENT_ITERATION.md + affected code/tests + task-relevant project docs only
```

Treat these as waste unless evidence says otherwise:

- recursive repo scans for bounded work
- preloading all `.agent` docs
- repeated architecture analysis for ordinary local changes
- re-planning the milestone after every slice
- mandatory bottleneck analysis before ordinary coding
- repeated full verification during the local loop
- duplicate tests/checks for the same failure
- duplicate workflow/status documents
- branch/PR churn without review/integration value
- tightly coupled parallel-agent work
- continuing after acceptance is satisfied

Reuse known project state rather than rediscovering it.

## 10. Delivery measurement

Metrics are diagnostic tools, not mandatory deliverables for every task.

Where existing evidence supports a real delivery decision, useful signals may include:

### Delivery / DORA

- deployment frequency
- change lead time
- change failure rate
- failed-deployment recovery time

### Flow

- milestone lead time
- logical-change/PR cycle time
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
- branch/PR churn
- low-value test maintenance

Do not fabricate telemetry. Do not build a metrics platform unless a concrete decision is blocked without it.

## 11. Legacy cleanup

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

## 12. Review order

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

## 13. Milestone gate and retrospective

Do not run a full gate after every slice.

At milestone completion, confirm:

- milestone acceptance is satisfied
- planned slices are complete or explicitly de-scoped by user decision
- integrated code satisfies required repository quality gates
- no material blocker remains inside scope
- relevant iteration/project state is current
- release-specific verification is performed only when actually needed

Retrospective is conditional and evidence-driven:

```text
Evidence -> Bottleneck -> Root Cause -> Small Improvement -> Verify
```

Run it after meaningful milestone/release completion, material delay/rework/failure, repeated friction, or explicit user request. Do not make it a per-slice ceremony.

## 14. Release strategy

Development integration does not automatically become a public release. `master` stays releasable; distribute the smallest coherent accepted milestone/increment.

Pre-1.0:

- `0.x.y`: bugfix/reliability/internal change
- `0.x.0`: coherent backward-compatible capability or intentional persisted-schema evolution
- `1.0.0`: core workflow, recovery/upgrades, permissions/privacy, and distribution lifecycle are stable

```text
verified logical changes
-> integrate continuously to releasable master
-> milestone gate
-> release-candidate decision
-> release-specific verification when needed
-> tiny release-only change if version/release notes are required
-> tag exact accepted commit
-> package from the accepted source/tag
```

No long-lived release branch. No feature expansion inside a release-only change.

Rollback before public distribution: revert the bounded merge/change and rebuild the last accepted tag. Persisted-schema changes must define migration/rollback safety in the change itself.

## 15. Definition of done

Engineering completion for a logical change means:

- approved observable slice acceptance passes
- realistic affected risks were identified
- sufficient high-signal evidence exists
- repository-required gates pass where applicable
- diff contains only intended scope

Milestone completion additionally requires the milestone gate and current iteration state update.

Then follow the STOP rule in `AGENTS.md`.
