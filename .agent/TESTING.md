# Testing & Verification Principle

Tests exist to reduce meaningful delivery risk, not to maximize coverage, test count, or testing ceremony.

The goal is:

```text
fast feedback -> sufficient confidence -> low maintenance cost -> safe delivery
```

—not maximum test coverage or maximum automation.

## 1. Risk-based verification

For every change:

1. identify what can realistically break
2. estimate the impact and likelihood of that failure
3. choose the cheapest high-signal verification that can detect it
4. increase verification depth only when risk justifies the additional cost

```text
CHANGE
  ↓
Classify risk
  ↓
┌────────────┬────────────┬────────────┐
│ LOW        │ MEDIUM     │ HIGH       │
↓            ↓            ↓
cheap        targeted     stronger
verification verification verification
             │            │
             │            ├─ boundary / contract
             │            ├─ integration
             │            ├─ critical journey
             │            ├─ migration / data
             │            ├─ security / privacy
             │            └─ other risk-specific checks
             │
             └────────────┬────────────
                          ↓
                    MERGE / ACCEPT
                          ↓
                 RELEASE CANDIDATE?
                    │            │
                   no           yes
                    │            ↓
                   stop     release-specific
                            verification
                                 ↓
                              RELEASE
```

The verification mechanism depends on the affected risk. Do not assume every change needs unit tests, integration tests, E2E, type checking, packaging, browser testing, or the same testing pyramid.

### Practical Chatspace examples

**Low risk**

Examples:
- documentation-only correction
- copy change
- isolated styling change with no interaction/layout contract change
- deleting a confirmed-unused comment or dead documentation reference

Possible verification:
- inspect diff
- render/visual check when presentation changed
- targeted lint only when code syntax changed

Do not add tests merely because a file changed.

**Medium risk**

Examples:
- Explorer interaction behavior
- command behavior
- local state transition
- provider URL classification
- UI wiring that changes observable behavior

Possible verification:
- focused deterministic behavior test
- affected component/domain test
- targeted typecheck/lint where useful
- smallest manual check for browser-only behavior

**High risk**

Examples:
- persisted data/schema/migration
- concurrency or persistence ordering
- permissions/security/privacy boundary
- provider contract/trust boundary
- destructive operation
- release/install/update behavior

Possible verification:
- deterministic regression tests
- boundary/contract tests
- migration/data-integrity checks
- integration or critical-journey checks
- explicit security/privacy review
- release-specific browser/package/install checks when actually releasing

Risk classification is not bureaucracy. Keep it proportional and short.

## 2. TDD

Use TDD when a deterministic automated test is the cheapest high-signal way to define or protect important behavior.

Prefer TDD or strong automated tests for:

- domain invariants
- algorithms and transformations
- persistence and data integrity
- concurrency
- migrations
- security/privacy boundaries
- external/provider contracts
- valuable deterministic regressions

Do not require TDD for:

- presentation-only changes
- styling/layout
- static markup
- copy/content changes
- trivial wiring
- exploratory implementation
- changes where another verification method is cheaper and equally reliable

For a defect, add a regression test only when it protects a realistic repeat failure at a useful boundary. When used, it should fail against the broken behavior before the fix.

## 3. Progressive confidence

Verification becomes broader or more expensive only when necessary.

```text
development
    ↓
fast feedback
    ↓
change confidence
    ↓
boundary/system confidence when required
    ↓
release confidence when releasing
```

Do not run every available test for every change.

Fast, deterministic, cheap checks should run frequently.

Expensive, broad, environment-dependent, or slow checks should run only when:

- the affected risk requires them
- a relevant boundary changed
- a critical workflow changed
- or the software is approaching release

The repository may keep a cheap baseline CI gate while it remains inexpensive. That is an implementation choice for this repository, not a universal rule that every agent must reproduce locally after every edit.

## 4. Avoid duplicate confidence

Do not test the same behavior repeatedly at multiple layers unless each layer protects a meaningfully different failure mode.

Prefer the verification boundary with the best ratio:

```text
confidence gained
-----------------
execution + maintenance + development cost
```

Examples:

- a pure folder-cycle invariant belongs in the domain-level behavior test rather than being duplicated through multiple UI/E2E cases
- a browser extension packaging failure cannot be proven by a unit test, so packaging verification belongs at the build/release boundary
- live ChatGPT usability cannot be honestly proven by synthetic unit tests, so use an explicit bounded manual browser check when that risk matters

## 5. Test value question

Before adding or running a test, ask:

> What realistic regression or failure does this detect?

If there is no strong answer, do not add the test.

Before adding a broader test, also ask:

> Is this failure already protected more cheaply at another layer?

If yes, avoid duplication.

## 6. Observable behavior over implementation trivia

Tests should protect behavior, invariants, boundaries, and failure modes.

Good:
- `moves a chat reference into a nested folder`
- `rejects moving a folder into its descendant`
- `coalesces rapid persistence writes to the latest snapshot`
- `opens a validated saved ChatGPT target in the active provider tab`

Weak unless the call itself is the contract:
- `calls setItem`
- `calls dispatch twice`
- `uses helper X`
- snapshot tests that mostly freeze markup structure

Prefer fakes at owned ports over mocking internals.

## 7. Persistence, migration, and data integrity

Persistence work is high-value deterministic test territory because failures can look like data loss.

Choose checks according to the changed risk. Relevant behaviors may include:

- canonical snapshot round-trip
- malformed/future schema fails safely
- recovery does not silently replace user state
- buffered/serialized writes preserve the latest accepted state
- reset affects only Chatspace-owned data
- migration is deterministic and preserves semantic behavior

For each actual migration, verify only the migration concerns that exist:

1. old data can be interpreted
2. output validates against the new contract
3. semantic behavior is preserved
4. migration is deterministic
5. unsafe partial overwrite is prevented

Do not maintain migration ceremony when no migration exists.

## 8. Provider and trust-boundary verification

Chatspace currently integrates with native ChatGPT through validated URL/tab behavior and must not use private APIs, cookies/session reuse, history crawling, DOM scraping, automated output extraction, network replay, or protection bypasses.

When provider integration changes, verify the affected contract at the cheapest stable boundary. Examples:

- supported target normalization
- active-tab classification
- validated navigation
- unsupported URL degradation

Do not create fake provider DOM/E2E layers for behavior that no longer depends on provider DOM.

Live ChatGPT validation is a manual release/review activity when the risk cannot be proven safely in CI.

## 9. UI and accessibility verification

Use automated interaction/accessibility tests when they protect an important deterministic interaction or regression.

Use visual/manual verification when it is cheaper and more reliable for presentation-only behavior.

Examples where automated behavior checks can be valuable:
- keyboard action semantics
- focus return for an important workflow
- icon-only button accessible name
- destructive action confirmation
- hierarchy invariants triggered through UI

Do not add automated tests merely to freeze Tailwind classes, exact layout pixels, or static copy.

## 10. Performance verification

Do not benchmark everything.

Add a performance check only after a meaningful budget, observed bottleneck, or regression risk exists.

Potential targets if evidence justifies them:
- large local Explorer projection
- graph projection at a defined scale
- persistence serialization/write behavior

A performance test without a meaningful budget or decision is usually noise.

## 11. Manual browser acceptance

Use manual browser acceptance only for behavior that actually requires the extension/browser/provider environment or when it is the cheapest reliable signal.

For the current daily-driver candidate, relevant checks include:

- extension loads in the Side Panel
- native ChatGPT remains usable
- supported ChatGPT conversation detection/navigation works
- saved conversation capture/resume works
- Explorer root/subfolder semantics work
- drag/drop hierarchy remains reversible and prevents invalid cycles
- light/dark preference survives side-panel reopen
- reload recovers local workspace
- no obsolete ChatGPT content script is required

Do not copy/store conversation output as part of the check.

Do not run the entire manual checklist for an unrelated low-risk change.

## 12. Release-specific verification

Development acceptance and release acceptance are different.

A release candidate may justify checks that ordinary PRs do not, such as:

- reproducible dependency install
- production build/package
- extension load/install/update lifecycle
- permissions/privacy review
- critical daily-driver browser journey
- recovery/upgrade behavior when relevant

If the change is not a release candidate and the affected risk does not require these checks, stop after sufficient change confidence.

## 13. Test data

Use invented/synthetic data.

Never commit:

- real ChatGPT exports containing personal data
- auth/session material
- screenshots with private conversations unless explicitly sanitized
- local storage/IndexedDB dumps from real usage

## 14. Flaky tests

A flaky test is a defect because it reduces signal.

When flaky:

- identify the nondeterminism/root cause
- quarantine only when necessary to unblock unrelated work
- do not normalize rerunning CI until green
- delete or replace a low-value flaky test when its maintenance cost exceeds the confidence it provides

## 15. Verification decision record

For ordinary work, the verification decision should fit in the PR/task summary:

```text
Risk: low / medium / high — <why>
Realistic failure: <what could break>
Verification: <cheapest high-signal evidence>
Broader checks: <only if justified>
```

Do not create a separate testing plan document for every task.

## 16. Review questions

Before adding or requesting verification:

- What realistic regression or failure does this detect?
- What is the impact and likelihood?
- Is this the cheapest reliable boundary?
- Is the same failure already protected elsewhere?
- Is broader verification justified by a boundary/critical-flow/release risk?
- Am I testing observable behavior rather than implementation trivia?
- Will this check continue to provide more confidence than maintenance cost?

If the answers do not justify the check, do less verification—not more ceremony.
