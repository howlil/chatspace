# pnpm Toolchain Migration

Goal: make pnpm the canonical package manager for Chatspace so local development and CI use the same commands.

Acceptance:
- `pnpm install` is the supported install command
- `pnpm build` runs the WXT production build
- `pnpm zip` runs `wxt zip` and produces the extension ZIP under `.output/`
- CI uses pnpm for install, lint, typecheck, test, build, and zip verification
- documentation no longer instructs contributors to use npm for normal project commands

Non-goals:
- dependency upgrades unrelated to the package-manager migration
- feature changes
