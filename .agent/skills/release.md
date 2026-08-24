# Skill: Release

Use for milestone tags, packaged extension releases, and store submissions.

## Preconditions

- accepted milestone scope frozen
- no unresolved merge-blocking review findings
- release target/version known
- migration path from previous released version known when applicable

## Procedure

### 1. Read release delta

Review commits/PRs since previous release. State user-visible changes and risky boundaries touched:

- provider adapter
- manifest permissions
- persistence schema
- UI shell
- dependencies

### 2. Clean verification

Run from a clean install/environment when feasible:

- dependency install
- lint/format check
- typecheck
- automated tests
- provider contract tests
- extension build
- applicable E2E

Record exact results.

### 3. Upgrade/migration test

If persisted schema changed:

- install/load previous version data fixture
- upgrade
- verify data/state preservation
- verify failure recovery path

### 4. Permission audit

Compare manifest permissions against actual features.

Any new permission needs explicit justification in release review/notes where user-visible.

Remove permissions for removed features.

### 5. Manual live-host compatibility

On supported browser/host:

- provider page loads normally
- Chatspace mounts once
- primary provider conversation UI remains usable
- panels collapse/restore
- navigation capability behaves honestly
- degraded state works if applicable
- no private conversation content recorded in evidence

### 6. Install/update lifecycle

Verify:

- fresh unpacked/package install
- reload/update
- disable/enable
- uninstall behavior does not damage provider/user data

### 7. Package/release artifact

Artifacts must come from verified commit SHA.

Do not rebuild from a dirty working tree after verification and call it the same release.

### 8. Release notes

Include:

```text
Added/Changed:
Fixed:
Known limitations:
Compatibility notes:
Data migration notes (if any):
```

Keep notes user-oriented.

### 9. Tag/release

Tag only after gates pass. Record commit SHA and artifact provenance.

### 10. Update state

Update `.agent/STATE.md` with released version, known limitations, and next single priority.

## Store submission extra gate

Before public store submission:

- privacy disclosure current
- extension description matches actual behavior
- permissions minimal
- screenshots current
- support/repository link valid
- no remote executable code
- store policy review complete

## Rollback thinking

Before release know:

- how to disable a broken provider capability
- whether previous extension version can read current stored schema
- whether migration is irreversible
- how users recover/export local data

Prefer reversible migrations and independently disableable provider capabilities.

## Output

```text
Version:
Commit/artifact:
Automated verification:
Manual compatibility:
Permission delta:
Migration evidence:
Known limitations:
Release/rollback status:
```
