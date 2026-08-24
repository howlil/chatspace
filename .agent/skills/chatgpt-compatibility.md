# Skill: ChatGPT / Provider Compatibility

Use for any change that observes, navigates, coexists with, or otherwise depends on provider web behavior.

## Hard boundary

Do not implement undocumented/private API calls, credential/session reuse, protection bypass, or automated/programmatic extraction of provider data/output.

Re-check current applicable provider terms/documentation before introducing a materially new provider-facing capability.

## Procedure

### 1. Define exact capability

Do not start with selectors. Start with:

```text
Capability:
User value:
Provider data/action required:
Supported source/path:
Fallback when unavailable:
```

Example capability:

> Detect whether Chatspace is on a supported conversation route so the shell can mount safely.

### 2. Compliance check

Answer:

- Does this require reading/storing provider Output programmatically?
- Does this require private network endpoints?
- Does this require auth/session state?
- Does it bypass a provider restriction?
- Is there an official export/API/documented route instead?

If unsafe/unclear, stop implementation and redesign/defer.

### 3. Keep adapter narrow

Only provider files may know provider selectors/route conventions.

Feature code consumes normalized capabilities/events.

### 4. Prefer capability detection

Do not assume a route/element implies every integration works.

```text
page detected
  ↓
capability checks
  ↓
healthy/degraded/unsupported
```

A missing capability disables only dependent commands.

### 5. Selector design

Prefer stable semantic anchors. Avoid:

- generated CSS classes
- positional selectors
- deep DOM paths
- styling-dependent assumptions

Each selector assumption must have a local contract fixture.

### 6. Observe minimally

If host lifecycle observation is necessary:

- attach to the narrowest stable ancestor
- filter mutations
- schedule/debounce reconciliation
- no expensive DOM scan in observer callback
- unsubscribe on unmount
- verify no duplicate observer after SPA transitions

### 7. Failure-first contract test

Create/update sanitized fixture for:

- expected structure
- changed/missing structure
- subtree replacement

Verify degraded behavior before implementing a selector fix/new capability.

### 8. Implementation

Keep all host details in adapter/selector modules. Return normalized values/errors.

No provider DOM node escapes into domain state.

### 9. Controlled verification

Run:

- provider contract tests
- affected feature tests
- extension build/typecheck
- local fixture E2E where relevant

### 10. Live manual check

When needed, manually confirm normal provider usage is not broken.

Do not record/copy private conversation content as test evidence.

### 11. Compatibility status

If behavior is unavailable, expose honest state:

```text
healthy
or
degraded: [capability]
or
unsupported: [reason]
```

Do not silently make a destructive fallback.

## Provider-change incident playbook

When a host update breaks Chatspace:

1. verify host itself still works
2. disable/degrade affected Chatspace capability
3. identify failed contract assumption
4. update minimal sanitized fixture from structure knowledge without storing user content
5. patch adapter only
6. run full provider contract suite
7. manual smoke check
8. release compatibility fix

Do not refactor unrelated workspace code during compatibility incident response.

## Output

```text
Capability:
Supported path/policy check:
Adapter change:
Contract evidence:
Degraded behavior:
Live check:
Residual risk:
```
