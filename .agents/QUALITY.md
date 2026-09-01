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

Current CI runs:

```text
pnpm install --frozen-lockfile
-> pnpm lint
-> pnpm typecheck
-> pnpm test
-> pnpm zip
```

CI runs on pull requests and pushes to `master`.

## Verification ownership

Use the narrowest stable boundary that can actually establish the relevant confidence.

### Deterministic repository tests

Use unit/component tests for behavior that can be proven without pretending to reproduce the browser environment, including:

- workspace hierarchy and reducer invariants;
- import/export/schema behavior;
- graph projection and relationship semantics;
- persistence ordering/coalescing;
- provider URL normalization and owned-port decisions;
- pure local-vault filename/path helpers;
- important keyboard, confirmation, accessibility, and component-wiring semantics.

Prefer pure functions or fakes at owned ports. Do not mock an external runtime deeply enough that the mock itself becomes the specification.

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

## Persistence and data integrity

Changes touching workspace persistence, schema, import/export, corruption handling, or write ordering require deterministic checks for the affected data risk.

Relevant invariants include accepted snapshots round-tripping, malformed/future data failing safely, recovery not silently overwriting user state, rapid saves preserving the latest accepted snapshot, serialized writes, scoped reset, and deterministic migrations.

A persisted-contract change requires explicit approval before implementation.

## Provider boundary

When provider integration changes, verify target normalization and owned-port decision behavior locally. Actual browser tab lifecycle remains black-box acceptance.

Provider DOM/content automation is outside the current approved architecture.

## Security-sensitive changes

A focused security review is required for changes to manifest permissions, provider target/navigation boundary, credentials/auth, workspace persistence schema or destructive data behavior, untrusted Markdown rendering, local-vault filesystem/path/permission contract, or remote telemetry.

Verification should target the changed threat boundary.

## Integration-ready gate

A logical change is integration-ready when:

- the requested observable behavior is satisfied;
- affected deterministic tests/checks are green;
- required repository CI gates pass where applicable;
- the diff contains only intended scope;
- changed canonical project knowledge/state is current when the change made it stale.

## Release confidence

Current product state: **daily-driver candidate, not public/store-ready**.

Keep these states distinct:

- **development-ready** — bounded change is correct with sufficient affected-risk evidence;
- **release-ready increment** — accepted increment can safely remain on releasable `master`;
- **daily-driver candidate** — release-ready plus required real-browser environment acceptance for repeated use;
- **store-ready** — daily-driver confidence plus reproducible packaging, permission/privacy review, install/update lifecycle, distribution metadata, and applicable store-policy requirements.

The package is currently pre-release (`0.0.0`). Do not invent a versioning scheme outside an actual release milestone.

## Current known evidence gap

Repository CI proves deterministic code/build/package confidence. It does not prove actual File System Access API behavior, real provider tab lifecycle, or complete narrow-panel Graph/Side Panel interaction. Those remain bounded live-browser acceptance concerns.

## Test data and diagnostics

Use synthetic/invented data. Do not commit or log real provider conversation exports containing private data, auth/session material, unsanitized private screenshots, raw real-user storage/IndexedDB dumps, or provider conversation content in diagnostics.

## Flaky tests

Treat nondeterministic tests as defects. Fix the source of nondeterminism; do not normalize rerunning CI until green as the repository workflow.
