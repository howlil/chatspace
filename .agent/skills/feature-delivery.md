# Skill: Feature Delivery

Use for any production feature or behavior change after its intent/scope is accepted.

## Inputs required

- observable acceptance criteria
- current source/tests for affected flow
- relevant `.agent` docs
- explicit non-scope

If the feature creates a new subsystem/boundary, stop and use architectural planning first.

## Procedure

### 1. Reconstruct current behavior

Read only the relevant code path and tests. State:

```text
Current flow:
State owner:
External dependencies:
Failure behavior:
```

Do not infer from filenames alone.

### 2. Define smallest vertical slice

The slice must produce one independently verifiable outcome.

Reject plans like "create all types/repositories/components" before any usable behavior exists.

### 3. Map files/boundaries

List exact expected files to create/modify. If implementation starts touching an unexpected shared boundary, pause and reassess scope.

### 4. Write RED test

One behavior. Use real domain/component behavior and stable fakes at external ports.

Run it and record the expected failure reason.

If it passes, the test does not prove new behavior; correct it before coding.

### 5. GREEN minimal implementation

Implement only enough to satisfy the failing behavior.

No:
- speculative options
- unrelated cleanup
- new generic framework
- adjacent features

### 6. Verify focused green

Run focused test then affected suite.

Fix production code when the test correctly specifies behavior. Do not weaken a valid test to make implementation pass.

### 7. Refactor while green

Only simplify:
- naming
- duplication
- boundaries
- test readability

No new behavior.

### 8. Add next behavior

Repeat RED/GREEN for the next acceptance criterion rather than implementing all remaining code at once.

### 9. Failure-path pass

Before full verification, explicitly inspect/test relevant:

- invalid state/input
- persistence failure
- missing provider capability
- remount/navigation lifecycle
- cancellation/unmount

Only those relevant to the feature; do not manufacture edge cases without consequence.

### 10. Full applicable quality gate

Run exact commands defined by current repository scripts. Include build/typecheck/lint/tests applicable to touched boundary.

For provider/UI work, perform required manual/contract checks.

### 11. Diff review

Inspect final diff for:

- unintended files
- duplicated behavior
- leaked provider-specific knowledge
- TODO/TBD placeholders
- debug logs
- unnecessary dependency/permission changes

### 12. Handoff

Report:

```text
Outcome:
Files/boundaries changed:
Verification evidence:
Known limitations:
Not verified:
Next recommended increment:
```

Update `.agent/STATE.md` after merge-worthy meaningful progress.

## Stop/replan triggers

Stop and reopen design if:

- feature requires private provider endpoint/extraction
- persistence canonical schema changes unexpectedly
- new cross-feature public interface is required
- more than one independent user outcome emerges
- proposed implementation makes host usability depend on Chatspace success

## Completion rule

No completion statement before fresh verification evidence.
