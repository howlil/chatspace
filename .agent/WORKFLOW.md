# Iteration & Development Workflow

## 1. Goal

Optimize for **short feedback loops with evidence**, not maximum parallel activity.

The default loop is:

```text
Understand -> Bound -> Test -> Implement -> Verify -> Review -> Merge -> Observe
```

## 2. Work intake

Every task starts with a one-paragraph intent statement containing:

- user problem
- expected observable behavior
- scope
- non-scope
- risk level

Then classify:

### Spike
Unknown feasibility; no production commitment.

### Bounded change
Existing path with small known surface.

### Architectural change
New subsystem/boundary or meaningful cross-cutting behavior.

## 3. Planning depth

### Spike
Write the question, cheapest valid experiment, stop condition, and expected evidence.

### Bounded
Use a compact in-task design:

```text
Behavior:
Files/boundaries:
Test first:
Failure mode:
Verification:
```

### Architectural
Create a design doc and implementation plan before code. Decompose so each increment is deployable/testable independently.

Do not create a 40-task plan when three vertical slices can validate the architecture sooner.

## 4. TDD loop

All behavior changes use RED -> GREEN -> REFACTOR.

### RED

- write one test for one behavior
- name it by observable outcome
- run it
- confirm it fails for the intended reason

A test that never failed is not evidence of a new behavior.

### GREEN

- implement the minimum code required
- do not bundle adjacent cleanup/features
- run the focused test
- run affected tests

### REFACTOR

Only while green:

- improve naming
- remove duplication
- clarify boundaries
- simplify implementation

Do not add new behavior during refactor.

## 5. Vertical slicing

Prefer user-visible slices:

Bad delivery decomposition:

1. all interfaces
2. all repositories
3. all components
4. integration

Good:

1. mount/unmount Chatspace shell safely
2. persist one panel layout
3. create/open one local folder
4. add nested tree operations
5. add tabs

Each slice proves the system end-to-end and limits integration risk.

## 6. Branch strategy

Default:

```text
master
  └── feat/<small-capability>
```

Other prefixes:

- `fix/`
- `refactor/`
- `chore/`
- `spike/`

Rules:

- branch from current `master`
- one coherent outcome per branch
- keep branches short-lived
- do not create dependent chains of branches unless unavoidable
- merge then delete branch
- prefer squash merge for feature PRs to keep `master` history outcome-oriented

## 7. Worktrees

For local agent execution, isolated git worktrees are recommended for independent feature tasks.

Use separate worktrees when:

- two tasks modify independent areas
- a long-running spike must not contaminate the main working tree
- a reviewer/fix loop needs isolation

Do not create multiple worktrees for tightly coupled tasks sharing interfaces under active change.

## 8. Commit discipline

Commits on a feature branch are checkpoints, not trophies.

Good checkpoint examples:

- `test: specify persisted panel layout behavior`
- `feat: persist workspace panel layout`
- `refactor: isolate panel dimension normalization`

Avoid:

- `update`
- `fix stuff`
- dozens of tiny non-reviewable commits
- unrelated formatting mixed with behavior

Final squash commit should describe the user/product outcome.

## 9. PR size

Aim for the smallest diff a reviewer can reason about as one behavior.

A PR is too large when:

- it contains multiple independent acceptance criteria that could ship separately
- reviewer must understand unrelated systems
- rollback would remove multiple unrelated features
- tests are difficult to attribute to one behavior

Do not optimize for arbitrary line limits.

## 10. PR template mentally enforced

Every PR should communicate:

### Why
What friction/defect is addressed?

### What
What observable behavior changed?

### Scope boundaries
What intentionally did not change?

### Verification
Exact commands/results + manual checks.

### Risk
Provider compatibility, permissions, persistence migration, performance, UX.

### Screenshots/video
Required for meaningful visual changes when practical.

## 11. CI design

Fast checks first.

Suggested order:

```text
format/lint
   ↓
typecheck
   ↓
unit/component tests
   ↓
build extension
   ↓
contract tests
   ↓
E2E where applicable
```

Goals:

- fast deterministic feedback
- no live ChatGPT dependency in mandatory CI
- provider behavior represented through sanitized fixtures/contracts
- expensive E2E kept targeted

## 12. Review loop

Review order:

1. correctness against acceptance criteria
2. architecture/boundary integrity
3. tests and failure cases
4. security/privacy/compliance
5. maintainability
6. performance evidence
7. style

Do not block delivery on subjective style when code is clear and consistent.

## 13. Fix-review cycle

When review finds a problem:

```text
review finding
    ↓
reproduce/validate
    ↓
write/adjust failing test
    ↓
minimal fix
    ↓
full affected verification
    ↓
resolve finding
```

Never implement review feedback blindly if the premise is wrong.

## 14. Debugging loop

Do not guess-and-patch.

```text
Symptom
  ↓
Reproduce
  ↓
Observe boundary/state
  ↓
Form one falsifiable hypothesis
  ↓
Test hypothesis
  ↓
Identify root cause
  ↓
Regression test
  ↓
Fix
```

If three fixes fail, stop patching and reassess the model of the system.

## 15. Parallel agent rules

Parallelize only independent work.

Good parallelism:

- UI visual review while another agent researches IndexedDB migration pattern
- isolated test-fixture preparation while feature implementation uses already-defined contract

Bad parallelism:

- two agents modifying the same provider adapter
- one agent changing an interface while another implements against the old interface
- multiple agents refactoring shared state concurrently

One agent/owner integrates shared contracts.

## 16. Fast iteration guardrails

Speed comes from reducing batch size and feedback time, not skipping validation.

Allowed optimizations:

- focused tests during RED/GREEN
- local fixtures instead of live external systems
- progressive quality checks while developing
- parallel research on independent unknowns
- squash branch history

Not allowed:

- skipping failing-test verification
- merging with known flaky tests
- postponing migration correctness
- manually claiming compatibility without a check
- stacking unrelated refactors while waiting for another blocker

## 17. Feature flags/capability gates

Use capability gates when external compatibility can fail independently.

Do not introduce a generic feature-flag platform for MVP.

A provider capability should degrade independently:

```text
workspace tree       healthy
local persistence    healthy
host navigation      degraded
host integration     degraded
```

## 18. Release cadence

Prefer releasable `master` continuously.

For early development:

- merge small increments
- tag milestone versions when a coherent user flow exists
- test unpacked extension continuously
- publish to store only after permissions/privacy/release automation are stable

## 19. State handoff

After each meaningful merge, update `.agent/STATE.md`:

```text
Current:
Evidence:
Known risks:
Next single priority:
Blocked:
```

This prevents agents from rediscovering project state and keeps work focused.

## 20. Stop conditions

Stop implementation and reopen design when:

- provider policy makes planned capability invalid
- an external assumption is disproven
- the change requires a new cross-cutting abstraction
- acceptance criteria cannot be tested with the proposed architecture
- the diff starts pulling in independent refactors

Fast delivery includes stopping bad work early.
