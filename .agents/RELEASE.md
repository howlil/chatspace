# Release

Chatspace is a packaged Chromium extension, so release/distribution has project-specific requirements beyond ordinary merge confidence.

## Current release state

Chatspace is a **daily-driver candidate**, not yet a public/store-ready release.

Repository CI establishes deterministic code/package confidence. Live browser acceptance remains separate where Chromium/Side Panel/File System Access behavior cannot be proven in CI.

## Build and package

Current package tooling:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm zip
```

`pnpm zip` is the repository CI package gate and uses the committed pnpm lockfile.

## Release states

### Development-ready

The bounded change satisfies its requested behavior and relevant repository checks/gates.

### Release-ready increment

The accepted change can remain safely on releasable `master` with canonical docs/state current.

### Daily-driver candidate

Release-ready plus the environment-specific browser behaviors needed for repeated personal use have been accepted.

### Store-ready

Daily-driver confidence plus distribution-specific requirements such as reproducible packaging, permission/privacy review, install/update lifecycle, metadata, and any store policy requirements.

Do not treat these states as interchangeable.

## Current live-browser acceptance gap

Before treating the current product as fully accepted for daily use, validate the affected real-browser boundaries, especially:

- Side Panel load/use at narrow widths;
- native ChatGPT coexistence;
- supported ChatGPT URL detection/navigation with no provider content script;
- Graph spatial navigation interactions;
- direct-folder picker/connect/write/update/restore/reconnect/change/disconnect;
- persisted workspace/theme restoration.

Run only the subset relevant to the release/change risk; do not repeat an exhaustive manual checklist for every small change.

## Direct-folder / companion release constraint

The browser File System Access path is the primary Markdown Sync UX.

The retained localhost companion must not be removed solely because the direct implementation exists. Removal is a separate bounded cleanup decision after direct-folder live acceptance demonstrates that connect/write/restore behavior is reliable enough for the intended environment.

## Permissions and privacy

A store/public release requires explicit review of:

- manifest permissions and host permissions;
- provider-data boundary;
- local storage/import/export behavior;
- direct filesystem access behavior;
- retained companion behavior if distributed/documented;
- privacy/security documentation consistency.

Provider conversation content is not part of Chatspace telemetry or repository test fixtures.

## Versioning

The package is currently pre-release (`0.0.0`). Do not invent a release/versioning scheme as part of unrelated engineering work. Choose/update version semantics only when an actual release milestone requires it.

## Rollback

For an unreleased bounded code change, rollback is normally a revert of the logical change on `master`.

Persisted-schema changes need explicit migration/reversibility handling in the change itself because code rollback alone may not restore user data compatibility.
