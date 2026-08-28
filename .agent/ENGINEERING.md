# Lean Engineering Policy

`AGENTS.md` defines the canonical agent lifecycle. This file contains the detailed engineering policy behind it.

Detailed product requirements and architecture remain in their existing project documents and must not be replaced by generic process rules.

## 1. Engineering economics

Optimize for:

```text
Value Delivered / (Engineering Time + Waiting + Rework + Cognitive Load + Compute Cost + Agent Context Cost)
```

Speed comes primarily from small batches, low rework and fast feedback. Never trade correctness/security for superficial coding speed.

Testing cost is part of engineering cost. More tests/checks are justified only when they reduce meaningful risk.

## 2. Requirement intake

Before implementation, reduce the task to:

```text
Problem: <one sentence>
Acceptance: <1-3 observable outcomes>
Non-goals: <what will not change>
Risk: <what can realistically break + impact/likelihood>
Evidence: <cheapest high-signal verification>
```

Reuse existing requirements in `PRODUCT.md`, `DELIVERY.md` or `plans/`. Do not rewrite them into a speculative roadmap.

## 3. Real lifecycle

The default Chatspace delivery path is:

```text
request
-> minimum context discovery
-> bounded acceptance
-> realistic risk classification
-> smallest vertical implementation
-> cheapest high-signal verification
-> broader confidence only when required
-> PR / repository-required checks
-> merge to releasable master
-> release-specific validation only for release candidates
```

Optimize waiting/rework before optimizing typing speed.

## 4. Small-batch iteration — XP + lean

```text
specify/reproduce
-> choose verification boundary
-> RED when useful
-> minimal change
-> touched-only refactor when useful
-> targeted verify
-> broaden only if risk requires
-> stop
```

- use the thinnest end-to-end slice that proves value
- use TDD when a deterministic automated test is the cheapest high-signal protection
- do not require TDD for styling, presentation, copy, trivial wiring, or other changes better verified another way
- automate owned contracts when the regression value justifies maintenance cost
- use explicit manual checks for browser/provider behavior automation cannot prove more cheaply/reliably
- stop immediately when acceptance and sufficient confidence pass

Avoid architecture-first scaffolding, feature bundles, broad UI rewrites, test ceremony and “while here” cleanup.

## 5. Risk-based verification

Tests exist to reduce meaningful delivery risk, not to maximize coverage, test count, or automation volume.

For every change:

1. identify what can realistically break
2. estimate impact and likelihood
3. choose the cheapest high-signal verification
4. broaden verification only when risk justifies the cost

```text
LOW risk     -> cheap verification
MEDIUM risk  -> targeted behavior/boundary verification
HIGH risk    -> stronger contract/integration/data/security/critical-flow evidence
RELEASE      -> release-specific confidence only when actually releasing
```

Detailed examples and rules live in `.agent/TESTING.md`.

### Development loop

Use the shortest useful feedback. Examples only:

```bash
pnpm exec vitest run <affected-test>
pnpm exec eslint <touched-files>
```

Do not run broad checks by habit. A docs-only change may need only diff inspection; a persistence/concurrency change should usually have deterministic automated protection; a presentation-only change may need a visual check.

### Merge confidence

Run the targeted evidence justified by the affected risk and satisfy repository-enforced PR checks.

Current repository CI may remain broader than the locally required verification while it is cheap. Do not interpret that as a universal requirement to reproduce every CI command for every edit.

A meaningful browser/UI/provider change requires manual acceptance only when that environment-specific failure cannot be proven more cheaply and reliably elsewhere.

### Release confidence

Release checks happen only for an actual distribution candidate or when the changed risk specifically requires them. Follow `.agent/TESTING.md` and `DELIVERY.md`.

No arbitrary coverage-percentage target. Flaky tests are defects because they lower signal.

## 6. Avoid duplicate confidence

Do not protect the same failure repeatedly at multiple layers unless each layer detects a meaningfully different failure mode.

Optimize for:

```text
confidence gained
-----------------
execution + maintenance + development cost
```

Before adding/running a test, ask:

> What realistic regression or failure does this detect?

Before adding a broader test, ask:

> Is this already protected more cheaply elsewhere?

If the answer does not justify the check, do less verification.

## 7. Git and WIP strategy

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
- avoid stacked PRs unless unavoidable
- never branch per file/layer/agent/micro-task
- no unrelated cleanup inside feature PRs
- commits are checkpoints; the PR is the review unit
- prefer squash merge and delete merged branches
- recheck after meaningful base movement
- keep concurrent WIP low; parallelize only independent work with stable boundaries

PR communicates: Why, What, Non-goals, Risk, Verification.

## 8. Code / abstraction rule

Use `CODE_PATTERNS.md` for project conventions.

Do not add an interface, factory, registry, base class, store, service, framework, cache, worker, event bus, DI container or plugin mechanism solely for future flexibility.

Extract when there is evidence of:

- a stable repeated pattern
- a real external/trust boundary
- defect-prone duplicated knowledge
- an independently changing responsibility
- a measured performance constraint

A dependency must solve a current problem and materially beat platform/native code on correctness, security, maintenance or delivery cost.

Preserve boundaries that already provide domain isolation, failure isolation, security or testability. Simplification is not file-count reduction.

## 9. Agent context and token discipline

Agent cost includes context discovery, reasoning, tool calls, re-reading, replanning, generated artifacts, tests/checks and rework.

Default rules:

- load `AGENTS.md` + `STATE.md`, then affected source/tests
- consult architecture/security/design docs only when the change touches those concerns
- reuse known repository state instead of rediscovering it
- do not recursively scan the repository for bounded work
- do not generate implementation plans longer than the task requires
- do not repeatedly run broad verification during implementation
- do not add tests without a realistic failure they protect
- do not duplicate confidence across layers
- do not produce duplicate workflow/status documents
- do not delegate tightly coupled work to multiple agents
- stop after completion instead of inventing adjacent improvements

Classify agent/process work mentally as **necessary / reducible / waste**. Remove recurring waste; do not optimize one-off trivial cost with new tooling.

## 10. Delivery measurement

Use metrics to locate constraints, not to score developers or reward output volume.

Where evidence exists, observe:

### Delivery/DORA

- deployment frequency
- change lead time
- change failure rate
- failed-deployment recovery time

### Flow

- PR/cycle time
- coding vs waiting time
- review wait
- CI duration/queue time
- batch size / changed-file surface
- WIP / concurrent PRs
- rework caused by acceptance failure

### Agent/DevEx

- repeated context discovery
- repeated broad verification
- avoidable replanning
- conflicting/duplicated instructions
- unnecessary handoffs
- low-value test maintenance

Do not fabricate metrics that the repository cannot measure. Record missing telemetry only when it blocks a real improvement decision. Do not add a metrics platform merely to satisfy a framework.

## 11. Legacy cleanup

“Legacy” means obsolete implementation or obsolete workflow machinery. It does not mean old project knowledge.

Deletion requires evidence such as:

- no runtime/import/entrypoint/route consumer
- replacement behavior is covered and active
- product scope explicitly removed the capability
- config/script exists only for a removed path

When truly dead, remove the ownership slice rather than keeping commented copies or compatibility wrappers.

Never delete as legacy:

- requirements / acceptance criteria
- architecture/system documentation
- project plans / rationale
- security/compliance constraints
- testing strategy/rationale
- delivery/product-convergence context
- durable design/product decisions

Mark knowledge superseded/completed/archived instead when appropriate.

## 12. Review

Review in this order:

1. acceptance correctness
2. unintended scope/batch growth
3. failure/security/data behavior
4. whether risk classification is credible
5. whether evidence is sufficient without duplication
6. simplicity/maintainability
7. measured performance
8. style

Do not block delivery on subjective style or missing tests that do not protect a realistic failure. Three failed fixes trigger root-cause-model reassessment rather than another blind patch.

Provider permissions, persistence/schema, security/trust boundaries and destructive migrations deserve stronger verification/review than docs or isolated visual copy changes.

## 13. Release strategy

Development merges do not automatically become releases. `master` stays releasable; distribute only a coherent accepted outcome.

Pre-1.0:

- `0.x.y`: bugfix/reliability/internal change
- `0.x.0`: coherent backward-compatible capability or intentional persisted-schema evolution
- `1.0.0`: core workflow, recovery/upgrades, permissions/privacy and distribution lifecycle are stable

```text
feature/fix PR
-> master accepted
-> release candidate decision
-> release-specific verification
-> tiny release PR (version + release notes only)
-> tag exact merge commit vX.Y.Z
-> package from tag
```

No long-lived release branch. No feature code in the release PR. No release framework/orchestrator until real distribution needs justify it.

Rollback before public distribution: revert the bounded merge and rebuild the last accepted tag. Persisted-schema changes must define migration/rollback safety in the change itself.

## 14. Definition of done / stop rule

Done means:

- observable acceptance passes
- realistic affected risks were identified
- sufficient high-signal evidence exists for those risks
- repository-required checks pass
- required manual acceptance is recorded only when applicable
- diff contains only the intended outcome
- no accidental debug/dead code remains in the touched slice
- any changed operational state/documentation is current

Then stop.

Do not continue into optional cleanup, broad refactoring, aesthetic work, future scalability architecture, extra dependencies, documentation expansion, speculative optimization, or extra testing that does not materially reduce delivery risk.

A worthwhile follow-up may be recorded briefly as a separate next task; it is not part of the completed change.
