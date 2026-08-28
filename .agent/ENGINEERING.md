# Lean Engineering Policy

`AGENTS.md` defines the canonical agent lifecycle. This file contains the detailed engineering policy behind it.

Detailed product requirements and architecture remain in their existing project documents and must not be replaced by generic process rules.

## 1. Engineering economics

Optimize for:

```text
Value Delivered / (Engineering Time + Waiting + Rework + Cognitive Load + Compute Cost + Agent Context Cost)
```

Speed comes primarily from small batches, low rework and fast feedback. Never trade correctness/security for superficial coding speed.

## 2. Requirement intake

Before implementation, reduce the task to:

```text
Problem: <one sentence>
Acceptance: <1-3 observable outcomes>
Non-goals: <what will not change>
Risk: <provider / persistence / permissions / UX / none>
Evidence: <test/manual check proving it>
```

Reuse existing requirements in `PRODUCT.md`, `DELIVERY.md` or `plans/`. Do not rewrite them into a speculative roadmap.

## 3. Real lifecycle

The default Chatspace delivery path is:

```text
request
-> minimum context discovery
-> bounded acceptance/design
-> smallest vertical implementation
-> focused local verification
-> pre-merge gate
-> review/PR
-> squash merge to releasable master
-> manual browser acceptance where required
-> milestone release only when worth distributing
```

Optimize waiting/rework before optimizing typing speed.

## 4. Small-batch iteration — XP + lean

```text
specify/reproduce -> RED -> minimal GREEN -> refactor -> focused verify -> full gate
```

- use the thinnest end-to-end slice that proves value
- use TDD for deterministic behavior/regressions
- automate owned contracts; use one explicit manual check for live browser/provider behavior CI cannot prove
- refactor only touched complexity while green
- stop immediately when acceptance and required gates pass

Avoid architecture-first scaffolding, feature bundles, broad UI rewrites and “while here” cleanup.

## 5. Verification tiers

### Local fast loop

Purpose: shortest useful feedback while editing.

Examples:

```bash
pnpm exec vitest run <affected-test>
pnpm exec eslint <touched-files>
```

Use focused tests first. Run broader checks only when the change surface/risk needs them.

### Pre-merge validation

After the outcome is complete:

```bash
pnpm verify
pnpm build
pnpm zip
```

A meaningful browser/UI/provider change also requires the smallest explicit manual acceptance check that CI cannot cover.

### Release validation

Release checks happen only for an actual distribution candidate. Follow section 12 and `DELIVERY.md`.

No arbitrary coverage-percentage target. Flaky tests are defects.

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
- avoid stacked PRs unless unavoidable
- never branch per file/layer/agent/micro-task
- no unrelated cleanup inside feature PRs
- commits are checkpoints; the PR is the review unit
- prefer squash merge and delete merged branches
- recheck after meaningful base movement
- keep concurrent WIP low; parallelize only independent work with stable boundaries

PR communicates: Why, What, Non-goals, Verification, Risk.

## 7. Code / abstraction rule

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

## 8. Agent context and token discipline

Agent cost includes context discovery, reasoning, tool calls, re-reading, replanning, generated artifacts and rework.

Default rules:

- load `AGENTS.md` + `STATE.md`, then affected source/tests
- consult architecture/security/design docs only when the change touches those concerns
- reuse known repository state instead of rediscovering it
- do not recursively scan the repository for bounded work
- do not generate implementation plans longer than the task requires
- do not repeatedly run the full suite during RED/GREEN
- do not produce duplicate workflow/status documents
- do not delegate tightly coupled work to multiple agents
- stop after completion instead of inventing adjacent improvements

Classify agent/process work mentally as **necessary / reducible / waste**. Remove recurring waste; do not optimize one-off trivial cost with new tooling.

## 9. Delivery measurement

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
- repeated full verification
- avoidable replanning
- conflicting/duplicated instructions
- unnecessary handoffs

Do not fabricate metrics that the repository cannot measure. Record missing telemetry only when it blocks a real improvement decision. Do not add a metrics platform for this project merely to satisfy a framework.

## 10. Legacy cleanup

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

## 11. Review

Review in this order:

1. acceptance correctness
2. unintended scope/batch growth
3. failure/security/data behavior
4. evidence/tests
5. simplicity/maintainability
6. measured performance
7. style

Do not block delivery on subjective style. Three failed fixes trigger root-cause-model reassessment rather than another blind patch.

Risk-based review is allowed: provider permissions, persistence/schema, security/trust boundaries and destructive migrations deserve stronger review than docs or isolated visual copy changes.

## 12. Release strategy

Development merges do not automatically become releases. `master` stays releasable; distribute only a coherent accepted outcome.

Pre-1.0:

- `0.x.y`: bugfix/reliability/internal change
- `0.x.0`: coherent backward-compatible capability or intentional persisted-schema evolution
- `1.0.0`: core workflow, recovery/upgrades, permissions/privacy and distribution lifecycle are stable

```text
feature/fix PR
-> master green
-> required manual acceptance
-> tiny release PR (version + release notes only)
-> green gate
-> squash merge
-> tag exact merge commit vX.Y.Z
-> package from tag
```

No long-lived release branch. No feature code in the release PR. No release framework/orchestrator until real distribution needs justify it.

Rollback before public distribution: revert the bounded merge and rebuild the last accepted tag. Persisted-schema changes must define migration/rollback safety in the change itself.

## 13. Definition of done / stop rule

Done means:

- observable acceptance passes
- relevant regression evidence exists
- required gate is green
- required manual acceptance is recorded
- diff contains only the intended outcome
- no accidental debug/dead code remains in the touched slice
- any changed operational state/documentation is current

Then stop.

Do not continue into optional cleanup, broad refactoring, aesthetic work, future scalability architecture, extra dependencies, documentation expansion or speculative optimization.

A worthwhile follow-up may be recorded briefly as a separate next task; it is not part of the completed change.
