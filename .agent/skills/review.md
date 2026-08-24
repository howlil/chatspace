# Skill: Code / Change Review

Use for pre-merge review or independent validation of medium/high-risk changes.

## Review order

Review in this order to avoid style noise hiding real defects:

1. acceptance criteria / scope
2. correctness and state transitions
3. failure modes
4. architecture boundaries
5. tests and evidence
6. security/privacy/compliance
7. performance where relevant
8. maintainability
9. style

## Procedure

### 1. Read intent before diff

Know what should change and what must not change.

### 2. Inspect diff for scope

Flag:
- unrelated cleanup
- hidden behavior changes
- dependency/permission changes not described
- generated/noisy files obscuring logic

### 3. Trace changed data flow

For meaningful behavior trace:

```text
input -> command -> state transition -> effect -> persisted/output/rendered state
```

Look for stale state, duplicate sources of truth, async race/lifecycle leaks, and error swallowing.

### 4. Boundary checks

- provider-specific knowledge stays in provider adapter
- UI does not own persistence/network/provider details
- domain stays framework-independent where intended
- renderer-specific graph types do not leak into canonical model

### 5. Test quality

Ask:

- did test verify behavior rather than mocks?
- was RED evidence provided for new behavior/bug regression?
- missing negative/failure path?
- migration/provider fixture updated when contract changed?
- flaky timing/sleep introduced?

### 6. Security/compliance

If provider/permission/external data changed:

- check `SECURITY_COMPLIANCE.md`
- verify no extraction/private endpoint/auth behavior
- check logs/storage for private content
- check fail-closed/degraded behavior

### 7. Findings severity

Use:

- **Blocker:** data loss, security/compliance, broken host, fundamentally wrong requirement
- **High:** likely correctness bug or boundary issue causing material failure
- **Medium:** maintainability/reliability defect worth fixing before merge if local
- **Low:** polish/style; do not block unless project convention materially matters

Every finding includes:

```text
Location:
Observed problem:
Concrete failure scenario:
Recommended minimal fix:
```

No vague "consider refactoring" comments.

### 8. Validate feedback before implementation

Review findings are hypotheses. Reproduce or reason from concrete code path before changing code. Do not blindly accept technically incorrect feedback.

### 9. Final review statement

State:

```text
Acceptance coverage:
Blocking findings:
Non-blocking follow-ups:
Verification inspected/run:
Residual risk:
```

Do not approve solely because CI is green.
