# pnpm Toolchain Migration

> **Status: Completed for package-manager migration / Historical plan.**
>
> pnpm is now the canonical package manager. The original requirement to run both `pnpm build` and `pnpm zip` in CI was later superseded after verification audit showed `wxt zip` already performs the production build; current CI intentionally uses one build+ZIP gate to avoid duplicate confidence.
>
> Reproducible-install hardening (committed `pnpm-lock.yaml` + frozen install) remains tracked separately in PR #11 and should not be confused with the completed package-manager migration.

## Historical goal

Make pnpm the canonical package manager for Chatspace so local development and CI use the same command family.

## Outcome

Completed:

- `pnpm` is the supported package manager
- project scripts use pnpm-compatible commands
- `pnpm build` remains available as the standalone WXT production build command
- `pnpm zip` runs `wxt zip` and performs production build + extension ZIP packaging
- CI uses pnpm for dependency install and verification commands
- normal project documentation no longer treats npm as the canonical workflow

Superseded detail:

- CI no longer needs both a standalone `pnpm build` and `pnpm zip`; that duplicated production-build confidence

Still separate/pending:

- commit the generated `pnpm-lock.yaml`
- switch CI install to `pnpm install --frozen-lockfile`
- remove the temporary PR #11 lockfile-artifact helper before merge

## Non-goals

- dependency upgrades unrelated to package-manager/reproducibility work
- product feature changes
