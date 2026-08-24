# Testing Strategy

## 1. Objective

Tests protect behavior and boundaries while keeping feedback fast. Chatspace must be testable without depending on live ChatGPT in CI.

## 2. Test layers

```text
many       unit/domain tests
  ↓        component tests
  ↓        adapter contract tests
 few       extension E2E tests
manual     live-host compatibility checks
```

### Unit/domain
Use for:
- folder/tree operations
- tab state
- panel normalization
- graph projection
- migration transforms
- command enablement
- error normalization

These tests should have no browser/React dependency where possible.

### Component
Use for:
- workspace tree keyboard behavior
- panel resizing
- tab interactions
- command palette
- empty/error states

Test observable behavior, not implementation details.

### Provider contract
Use sanitized local fixtures representing only structure needed for supported adapter behavior.

Fixtures must not contain copied private user conversations or sensitive host data.

Contract tests answer:
- can page type be detected from the supported fixture?
- can capability availability be evaluated?
- does host lifecycle replacement recover?
- does unsupported structure degrade cleanly?

### Extension E2E
Use Playwright against controlled/local fixture pages and built extension where practical.

E2E flows:
- extension mounts and unmounts
- host remains interactive
- layout persists after reload
- folder create/rename/move persists
- tabs restore
- compatibility failure disables only dependent features

Mandatory CI must not automate extraction from live ChatGPT.

## 3. TDD requirement

Behavior changes:

```text
RED
- write focused behavior test
- execute
- confirm expected failure

GREEN
- minimal implementation
- execute focused test
- execute affected suite

REFACTOR
- simplify while green
```

A regression test for a bug must fail against the broken behavior before the fix is accepted.

## 4. Test naming

Name by observable behavior:

Good:
- `moves a chat reference into a nested folder`
- `restores panel widths after repository reload`
- `disables host navigation when capability detection fails`

Bad:
- `tree test`
- `works correctly`
- `calls setItem`

## 5. Mocking policy

Prefer fakes at ports over mocking internals.

Good:

```ts
class InMemoryWorkspaceRepository implements WorkspaceRepository { ... }
```

Avoid tests whose only assertion is that a mock function was called unless the call itself is the externally meaningful contract.

Provider adapter contract tests should use DOM fixtures, not mocks of `querySelector` chains.

## 6. Persistence tests

Required behavior:

- round-trip canonical snapshot
- missing workspace
- interrupted/failed write handling
- schema migration N -> N+1
- unknown future schema fails safely
- malformed stored data produces recoverable error
- reset affects only Chatspace-owned data

Never silently default malformed persisted data to empty if that could look like data loss.

## 7. Migration verification

For each migration:

1. old fixture loads
2. migration output validates against new schema
3. semantic behavior is preserved
4. migration is deterministic
5. original data remains unchanged until new write succeeds

## 8. DOM/adapter tests

Every provider selector/capability assumption needs a contract test.

Maintain fixtures for:

- healthy supported host
- missing optional region
- replaced subtree after SPA navigation
- unsupported structure

Avoid snapshots of entire host pages. Keep fixtures minimal and semantic.

## 9. UI accessibility tests

Automated checks where useful plus behavior tests for:

- focus order
- keyboard tree navigation
- tab keyboard semantics
- icon button accessible names
- command palette focus return
- panel collapse without focus loss

Automated accessibility tools supplement, not replace, interaction tests.

## 10. Performance tests

Do not benchmark everything. Add targeted performance tests after a budget/risk exists.

Candidate benchmarks:

- tree projection with 1,000 local references
- graph projection with defined node/edge scale
- repeated host mutation reconciliation
- persistence serialize/load latency

Performance tests should compare against explicit budgets or baselines.

## 11. Manual compatibility checklist

Live ChatGPT validation is a manual release/review activity unless an official automation path explicitly permits it.

Check:

- normal ChatGPT conversation remains usable
- composer remains usable
- navigation works normally when Chatspace hidden
- extension mounts on intended routes only
- panel resize doesn't cover critical host controls unexpectedly
- SPA navigation does not duplicate Chatspace roots/listeners
- reload recovers workspace
- compatibility degraded state is honest

Do not copy/store conversation output as part of the check.

## 12. Test data

Use invented/synthetic test conversations and labels.

Never commit:

- real ChatGPT exports containing personal data
- auth/session material
- screenshots with private conversations unless explicitly sanitized
- local IndexedDB dumps from real usage

## 13. Flaky tests

A flaky test is a defect.

When flaky:

- quarantine only if necessary to unblock unrelated work
- create a concrete owner/fix task
- identify nondeterminism root cause
- do not normalize rerunning CI until green as workflow

## 14. Suggested commands

Exact scripts will be established during bootstrap. Target interface:

```bash
pnpm test             # unit + component
pnpm test:contract    # provider fixtures/contracts
pnpm test:e2e         # controlled extension E2E
pnpm typecheck
pnpm lint
pnpm build
pnpm verify           # full merge gate
```

Do not claim these commands exist until bootstrap creates and verifies them.

## 15. Test review questions

- What production change would make this test fail?
- Is the test asserting behavior or implementation trivia?
- Did the test fail before implementation/fix?
- Does it cover the relevant failure mode?
- Is external behavior represented through a stable contract/fixture?
- Will this test survive a reasonable internal refactor?
