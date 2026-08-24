# Skill: Systematic Debugging

Use for bugs, flaky behavior, test failures, build failures, compatibility regressions, and unexpected state.

## Rule

Do not patch before reproducing and locating the failing boundary.

## Procedure

### 1. State the symptom precisely

Bad:
> tree is broken

Good:
> after renaming a nested folder and reloading, the child chat reference appears at root while IndexedDB still contains the original folderId

Capture:
- trigger
- expected
- actual
- frequency
- environment/version

### 2. Reproduce minimally

Prefer smallest deterministic reproduction:

- unit/domain test
- component test
- sanitized provider fixture
- local extension E2E
- manual live host only when the issue exists only there

Do not use live ChatGPT as first debugger for generic domain/UI defects.

### 3. Identify the boundary

Trace state/data flow:

```text
input/event
  ↓
adapter/command
  ↓
domain transition
  ↓
persistence/effect
  ↓
render/output
```

Inspect where expected state first diverges from actual state.

### 4. Form one falsifiable hypothesis

Example:

> Migration v2->v3 drops `folderId` only when `parentId` is null.

Not:

> IndexedDB is weird.

### 5. Test hypothesis cheaply

Add instrumentation/test assertion at the suspected boundary. Avoid changing behavior yet.

If falsified, discard it and form the next hypothesis.

### 6. Root cause

State cause in mechanism terms:

```text
Cause:
Why existing tests missed it:
Why symptom appeared here:
```

Do not confuse the visible crash location with root cause.

### 7. Regression RED

Write a test representing the user-visible defect. Verify it fails against current broken code.

### 8. Minimal fix

Change the lowest correct boundary. Avoid broad rewrites unless root cause is architectural and design is reopened.

### 9. Verify GREEN + adjacent regressions

- focused regression test
- affected suite
- required full quality gate before merge

For compatibility bugs, include degraded/unsupported fixture behavior.

### 10. Remove temporary diagnostics

No debug dumps, raw provider content, or temporary bypasses remain.

## Special case: provider UI changed

1. Do not immediately add a new brittle selector.
2. Confirm which capability failed.
3. Confirm Chatspace still degrades safely.
4. Re-check current supported/policy constraints if the proposed fix changes integration behavior.
5. Update minimal sanitized fixture.
6. Fix selector/capability adapter only.
7. Run contract tests.
8. Manual compatibility check where applicable.

## Special case: flaky test

Investigate nondeterminism source:

- shared state
- timers
- async lifecycle
- ordering
- leaked listeners
- random data
- external dependency

Do not solve with arbitrary sleeps or repeated retries unless timing itself is the contract.

## Three-failed-fix rule

If three plausible fixes fail, stop changing code. Reconstruct the system model from evidence and reassess the boundary/root cause.

## Output

```text
Symptom:
Reproduction:
Root cause:
Regression test:
Fix:
Verification:
Residual risk:
```
