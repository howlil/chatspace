# Quality

This file defines Chatspace-specific verification, CI, release-confidence, and evidence requirements.

## Tooling

Repository commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm verify
pnpm build
pnpm zip
```

CI runs on pull requests and pushes to `master`.

The repository keeps one stable required check named `verify`, but the work behind that check is change-aware on pull requests:

```text
PR changed files
-> classify affected surface
   -> extension/runtime affected? run extension quality gate
   -> landing affected? run landing build gate
   -> documentation-only? run neither runtime gate
-> final verify check enforces every relevant gate
```

Pushes to `master` always run both extension and landing gates so the releasable branch receives full repository integration confidence.

A change to `.github/workflows/ci.yml` also forces both gates because the gate implementation itself changed.

### Extension gate

```text
pnpm install --frozen-lockfile
-> pnpm lint
-> pnpm typecheck
-> pnpm test
-> pnpm zip
```

### Landing gate

```text
landing frozen install
-> Astro landing build
```

Extension and landing gates run independently and in parallel when both are relevant. Node/pnpm dependency caches are keyed from the owning lockfile to reduce repeated install cost without relaxing frozen dependency resolution.

The repository CI gate is an integration/release-confidence boundary. It is not the required inner loop for every local logical change.

## Risk-proportional verification

Use the narrowest stable boundary that can actually establish confidence for the changed risk. Escalate only when a cheaper layer cannot prove the relevant behavior.

### Documentation / repository-knowledge changes

For documentation-only changes with no executable/configuration behavior change:

- verify internal consistency against current code/contracts;
- inspect the diff for stale/conflicting authority;
- do not run runtime tests merely for ceremony;
- PR CI should classify the change as documentation-only and preserve a green `verify` result without installing/building unrelated runtime surfaces.

### Static verification

Use lint/typecheck/build checks when the changed risk is compilation, type safety, packaging, configuration, or static integration.

Do not treat static checks as evidence for runtime behavior they cannot establish.

### Deterministic behavior tests

Use unit/component tests for behavior that can be proven without pretending to reproduce the browser environment, including:

- workspace hierarchy and reducer invariants;
- structured properties, saved-view definitions/projection, and template behavior;
- import/export/schema/migration behavior;
- graph projection and relationship semantics;
- persistence ordering/coalescing;
- provider URL normalization and owned-port decisions;
- pure local-vault filename/path helpers;
- important keyboard, confirmation, accessibility, and component-wiring semantics.

Prefer focused tests around the changed observable behavior during implementation. Broaden to the full deterministic suite when a change touches shared domain/persistence/UI foundations or reaches the extension CI gate.

Prefer pure functions or fakes at owned ports. Do not mock an external runtime deeply enough that the mock itself becomes the specification.

### Repository-owned integration tests

Use integration coverage when a user behavior crosses multiple real repository-owned boundaries and isolated tests cannot establish the contract, for example:

- domain -> reducer/application orchestration -> persistence adapter serialization;
- import parser -> migration/validation -> accepted workspace transition;
- structured-property state -> saved-view projection -> user-visible workspace behavior.

Do not add integration tests when an existing deterministic owner boundary already proves the behavior adequately.

### Black-box / live-browser acceptance

The following are environment behavior and must not be claimed as accepted from jsdom or fake browser handles:

- Chromium Side Panel lifecycle and narrow-panel visual usability;
- real `showDirectoryPicker()` prompts/cancellation behavior;
- real filesystem permission prompts and restored-handle permission behavior;
- actual IndexedDB persistence of browser directory handles across extension/browser lifecycle;
- actual filesystem writes through `FileSystemFileHandle`/writable streams;
- real provider tab lifecycle/navigation in Chromium;
- Graph pan/zoom/fit/drag and visual interaction quality in the actual Side Panel.

Repository tests may still protect local decision logic around those boundaries, but acceptance of the environment itself is black-box/live-browser evidence.

Do not create “daily-driver”, “browser”, or “end-to-end” test names around a jsdom/fake-runtime test unless the test actually runs that environment.

## Verification selection by change shape

Use this as a decision aid, not a mandatory ladder:

| Change shape | Minimum relevant evidence |
| --- | --- |
| docs-only canonical knowledge | consistency + diff review; runtime CI skipped on PR |
| local pure logic | focused deterministic tests; typecheck if types changed |
| reusable/shared domain behavior | focused tests + relevant broader deterministic suite |
| persisted schema/import/export | migration/data-integrity tests + relevant deterministic suite + typecheck |
| UI interaction semantics | focused component/interaction test + accessibility semantics |
| cross-owner repository workflow | integration coverage when isolated owners cannot prove the path |
| browser/filesystem/provider-runtime behavior | deterministic owned-port logic + real-browser acceptance |
| landing-only implementation | landing build gate; extension gate is unrelated |
| release-ready master | full extension gate + landing gate + required environment evidence for changed risk |

A higher-cost layer is required only when it covers material risk left unproven by lower-cost evidence.

## CI scoping invariants

Change-aware CI is an optimization of irrelevant work, not a reduction in relevant confidence.

- Unknown non-documentation paths fail safe into the extension/runtime gate.
- `landing/**` changes run the landing gate; landing Markdown-only changes may remain documentation-only.
- `.github/workflows/ci.yml` changes run both gates.
- pushes to `master` run both gates regardless of changed path.
- a skipped job is acceptable only when change classification says that surface is irrelevant.
- the final `verify` job fails if any relevant selected gate fails or is cancelled.
- do not use path scoping to hide a failure from a surface actually affected by the change.

If repository structure adds a new executable surface, update CI classification in the same logical change so unknown-path fallback is not the permanent ownership model.

## Persistence and data integrity

Changes touching workspace persistence, schema, note properties, saved views/templates persistence, import/export, corruption handling, migration, or write ordering require deterministic checks for the affected data risk.

Relevant invariants include accepted snapshots round-tripping, malformed/future data failing safely, recovery not silently overwriting user state, rapid saves preserving the latest accepted snapshot, serialized writes, scoped reset, deterministic migrations, saved views remaining projections rather than copied notes, and unsupported structured property shapes failing explicitly.

A persisted-contract change requires explicit approval before implementation.

## Provider boundary

When provider integration changes, verify target normalization and owned-port decision behavior locally. Actual browser tab lifecycle remains black-box acceptance.

Provider DOM/content automation is outside the current approved architecture.

## Security-sensitive changes

A focused security review is required for changes to manifest permissions, provider target/navigation boundary, credentials/auth, workspace persistence schema or destructive data behavior, untrusted Markdown rendering, local-vault filesystem/path/permission contract, import/export filesystem scope, or remote telemetry.

Verification should target the changed threat boundary rather than trigger unrelated testing by default.

## Integration-ready change

A logical change is integration-ready when:

- the intended observable behavior for its slice is satisfied;
- affected risk has sufficient evidence at the narrowest truthful boundary;
- the diff contains only intended coherent scope;
- changed canonical project knowledge/state is current when the implementation made it stale.

A slice is demonstrable when its integrated user behavior works across the owners it actually requires. A milestone is complete only when the coherent milestone user outcome is delivered end-to-end; isolated architecture-layer completion is not milestone completion.

## CI gate behavior

Do not weaken, skip, or remove a relevant CI check merely to obtain green status.

If CI fails:

1. inspect the concrete failure;
2. determine whether the check is relevant to the changed risk/repository integration contract;
3. fix the product/code/test/configuration defect when relevant;
4. change the gate only when evidence shows the gate itself is obsolete, duplicated, or incorrectly scoped.

Do not normalize repeated reruns until green.

CI output should preserve diagnostic ownership: lint, typecheck, deterministic test, package, and landing-build failures remain separate named steps rather than being hidden inside a monolithic opaque command.

## Release confidence

Current product state: **daily-driver candidate, not public/store-ready**.

Keep these states distinct:

- **development-ready** — bounded change is correct with sufficient affected-risk evidence;
- **release-ready increment** — accepted increment can safely remain on releasable `master` after repository integration gates;
- **daily-driver candidate** — release-ready plus required real-browser environment acceptance for repeated use;
- **store-ready** — daily-driver confidence plus reproducible packaging, permission/privacy review, install/update lifecycle, distribution metadata, and applicable store-policy requirements.

The package is currently pre-release (`0.0.0`). Do not invent a versioning scheme outside an actual release milestone.

## Current known evidence gap

Repository CI proves deterministic code/build/package confidence. It does not prove actual File System Access API behavior, real provider tab lifecycle, or complete narrow-panel Graph/Side Panel interaction. Those remain bounded live-browser acceptance concerns.

## Test data and diagnostics

Use synthetic/invented data. Do not commit or log real provider conversation exports containing private data, auth/session material, unsanitized private screenshots, raw real-user storage/IndexedDB dumps, or provider conversation content in diagnostics.

## Flaky tests

Treat nondeterministic tests as defects. Fix the source of nondeterminism; do not normalize rerunning CI until green as the repository workflow.
