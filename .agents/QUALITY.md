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

Use the narrowest stable boundary that protects the affected Chatspace behavior.

### Domain / application tests

Use deterministic tests for behavior such as:

- workspace hierarchy invariants;
- move/create/delete semantics;
- state transitions;
- graph projection/relationship semantics;
- persistence transformations and ordering;
- provider URL classification/navigation decisions;
- integration state that can be proven without a live browser.

Prefer fakes at owned ports over browser/provider internals mocked throughout the codebase.

### UI interaction tests

Use Testing Library/Vitest when observable interaction can be deterministically protected, including important keyboard semantics, confirmation flows, accessible names, and feature wiring.

Do not freeze Tailwind class lists or layout pixels with low-signal tests.

### Manual browser acceptance

Use real Chromium Side Panel acceptance when repository tests cannot prove the environment-specific behavior.

Current high-value manual boundaries include:

- the extension opens and remains usable in the Side Panel;
- native ChatGPT remains unobscured and usable;
- supported ChatGPT conversation detection/navigation works without a provider content script;
- narrow Side Panel layout remains usable;
- Graph pan/zoom/fit/search/selection/connect/delete/drag behavior works in the actual Side Panel;
- direct `showDirectoryPicker()` connect/write/update/restore/reconnect/change/disconnect behavior works;
- workspace reload restores canonical local state;
- explicit light/dark preference persists.

Do not run the full manual daily-driver journey for unrelated low-risk work.

## Persistence and data integrity

Changes touching workspace persistence, schema, import/export, corruption handling, or write ordering require deterministic checks for the affected data risk.

Relevant invariants include:

- accepted snapshots round-trip;
- malformed/future data fails safely;
- recovery does not silently overwrite user state;
- rapid saves preserve the latest accepted snapshot;
- physical writes remain serialized;
- reset affects only Chatspace-owned data;
- migrations are deterministic and preserve intended semantics.

A persisted-contract change requires explicit approval before implementation.

## Provider boundary

When provider integration changes, verify the affected URL/tab contract at a stable local boundary:

- supported target normalization;
- active-tab state classification;
- validated navigation;
- unsupported origin/target failure;
- provider unavailability degrading only provider-dependent behavior.

Provider DOM/content automation is outside the current approved architecture.

## Security-sensitive changes

A focused security review is required for changes to:

- manifest permissions;
- provider target/navigation boundary;
- credentials/auth;
- workspace persistence schema or destructive data behavior;
- untrusted Markdown rendering;
- local-vault filesystem/path/permission contract;
- retained localhost companion command/data/path contract;
- remote telemetry.

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

Keep these project-specific confidence states distinct:

- **development-ready** — bounded change is correct with sufficient affected-risk evidence;
- **release-ready increment** — accepted increment can safely remain on releasable `master`;
- **daily-driver candidate** — release-ready plus required real-browser environment acceptance for repeated use;
- **store-ready** — daily-driver confidence plus reproducible packaging, permission/privacy review, install/update lifecycle, distribution metadata, and applicable store-policy requirements.

The package is currently pre-release (`0.0.0`). Do not invent a versioning scheme outside an actual release milestone.

For ordinary unreleased logical changes, rollback is normally a revert. Persisted-schema changes require explicit migration/reversibility handling because code rollback alone may not restore data compatibility.

## Current known evidence gap

Repository CI cannot prove actual File System Access API behavior inside the Chromium extension Side Panel or complete narrow-panel visual/interaction acceptance. Those remain bounded manual acceptance concerns for the current daily-driver candidate.

The retained localhost companion must not be removed solely because direct-folder code exists. Removal is a separate bounded cleanup after direct-folder live acceptance establishes sufficient confidence.

## Test data and diagnostics

Use synthetic/invented data.

Do not commit or log:

- real provider conversation exports containing private data;
- auth/session material;
- private conversation screenshots unless explicitly sanitized;
- raw real-user storage/IndexedDB dumps;
- provider conversation content in diagnostics.

## Flaky tests

Treat nondeterministic tests as defects. Fix the source of nondeterminism; do not normalize rerunning CI until green as the repository workflow.
