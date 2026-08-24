# Quality Gates

## 1. Principle

Quality gates are evidence gates. Agents must not use phrases like "done", "fixed", "passes", or "ready" without fresh evidence from the applicable checks.

## 2. During development

Focused RED/GREEN loop:

- failing test observed for intended reason
- minimal implementation
- focused test green
- affected tests green
- refactor only while green

Do not run the slowest suite after every keystroke. Do run the right focused evidence.

## 3. Pre-commit gate

For changed behavior:

- focused tests pass
- type errors in touched area resolved
- no debug artifacts/secrets
- diff contains intended files only

For docs-only commits, verify links/paths/consistency manually or with available doc tooling.

## 4. Pre-PR gate

Target full command when bootstrapped:

```bash
pnpm verify
```

Expected composition:

```text
format/lint
+ typecheck
+ unit/component tests
+ provider contract tests
+ extension build
+ targeted E2E where required
```

Until `pnpm verify` exists, the PR must list exact commands run instead of pretending the umbrella command exists.

## 5. Architecture gate

PR must not:

- leak provider selectors into generic feature code
- call persistence directly from presentational components
- make graph renderer types canonical domain types
- create cross-feature cyclic dependencies
- introduce abstractions with no current consumer/problem
- silently add a new trust boundary

## 6. Provider integration gate

Any provider-facing change requires:

- current policy/documentation checked if behavior materially changes
- no private endpoint/session-token behavior
- no automated extraction of provider data/output
- adapter contract tests updated
- degraded/unsupported behavior defined
- live manual compatibility check when appropriate

## 7. Persistence gate

If persisted schema changes:

- schema version increments
- migration written
- old fixture -> new schema test passes
- malformed input behavior tested
- failed migration does not destroy original data
- reset/export behavior still correct

No "we can migrate later" after users can have persistent data.

## 8. UI gate

For meaningful UI changes:

- keyboard path tested
- focus state visible
- light/dark readability checked
- narrow-width behavior checked
- loading/empty/error state applicable behavior checked
- no host critical control permanently obscured
- screenshot/video evidence in PR when practical

## 9. Performance gate

Required only when change touches a known hot path or violates a budget/risk assumption.

Evidence may be:

- benchmark
- profiler trace
- mutation-count measurement
- render-count measurement
- before/after timing

Do not approve performance claims based on intuition.

## 10. Security gate

Required review if change touches:

- manifest permissions
- provider adapter
- external/host text rendering
- storage of new data class
- future localhost/filesystem bridge
- dependency with privileged runtime behavior

Questions:

- new input/trust boundary?
- new permission?
- any sensitive content logged/persisted?
- fail-open behavior?
- injection/path traversal risk?

## 11. PR review gate

A reviewer should be able to answer yes:

- Does the change solve the stated problem?
- Can I identify the acceptance tests?
- Is the failure behavior clear?
- Is the dependency direction preserved?
- Is there unnecessary scope?
- Can this be reverted independently?

## 12. Merge gate

Before merge:

- required CI/checks green
- review findings resolved/explicitly rejected with reasoning
- current branch includes intended latest changes
- no known critical/high defect introduced
- no placeholder `TODO/TBD` for acceptance-critical behavior
- release/state docs updated when relevant

Prefer squash merge for feature branches.

## 13. Release gate

Before tagged/store release:

- clean build from fresh install
- full automated suite passes
- unpacked extension smoke test
- manual live host compatibility checklist
- permissions diff reviewed
- data migration from previous released version tested
- release notes describe user-visible changes + known limitations
- rollback/recovery path understood

## 14. Evidence template

Use this concise block in handoffs/PRs:

```text
Verification
- `pnpm test ...` -> PASS (N tests)
- `pnpm typecheck` -> PASS
- `pnpm build` -> PASS
- Manual: [exact scenario] -> PASS

Not verified
- [anything not run / unavailable]
```

If a check was not run, say so. Never infer it from a different check.

## 15. Merge blockers vs follow-ups

Merge blocker:
- violates acceptance criteria
- data-loss risk
- security/compliance violation
- broken host usability
- failing deterministic test/build/typecheck
- missing migration

Follow-up candidate:
- unrelated cleanup
- speculative abstraction
- minor non-blocking polish
- optimization without evidence of need

Do not let cleanup expand the critical path.
