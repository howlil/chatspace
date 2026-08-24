# Iteration 0 Bootstrap Implementation Plan

> For agentic workers: implement task-by-task with RED → GREEN → REFACTOR and fresh verification before completion claims.

**Goal:** Establish the smallest reproducible Chatspace browser-extension foundation that can mount/unmount an isolated React shell on an explicitly supported host page and pass lint, typecheck, test, and build in CI.

**Architecture:** Chromium Manifest V3 extension built with WXT. The content script owns only a Shadow DOM-isolated Chatspace shell; provider-specific behavior is intentionally absent from Iteration 0. React renders one harmless status surface. Runtime code remains thin and testable; future workspace/domain features are not introduced.

**Tech Stack:** Node 22, npm, WXT 0.21.4, React 19.2.8, TypeScript 6.0.3, ESLint 10.9.0 + typescript-eslint 8.67.0, Vitest 4.1.10, Testing Library, jsdom 30.0.1.

**Spec:** `.agent/STATE.md`, `.agent/ARCHITECTURE.md`, `.agent/WORKFLOW.md`, `.agent/TESTING.md`

## Global Constraints

- Chromium Manifest V3 first.
- Exact package versions in `package.json`; generate and commit `package-lock.json` as soon as a package-manager environment is available.
- WXT requires Node >=22 for v0.21.x.
- React is enabled through `@wxt-dev/module-react`.
- Content UI uses WXT `createShadowRootUi` with `cssInjectionMode: 'ui'`.
- The content script matches only `https://chatgpt.com/*` in Iteration 0.
- No ChatGPT DOM scraping, private endpoints, auth/session access, conversation extraction, folders, tabs, notes, graph, IndexedDB, or provider adapter behavior in this iteration.
- Tests must not require live ChatGPT.
- CI must execute lint, typecheck, test, and build.

---

## Task 1 — Reproducible toolchain and RED bootstrap test

**Files:** `package.json`, `tsconfig.json`, `wxt.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `tests/setup.ts`, `src/app/shell/BootstrapShell.test.tsx`

**Behavior under test:** the bootstrap shell exposes a visible `Chatspace` label and a non-interactive `Foundation ready` status.

1. Add exact dependency versions and scripts: `prepare`, `dev`, `build`, `lint`, `typecheck`, `test`, `test:watch`, `verify`.
2. Configure WXT React module and minimal MV3 manifest metadata.
3. Configure strict TypeScript extending WXT-generated config after `wxt prepare`.
4. Configure Vitest + jsdom and ESLint flat config.
5. Write the shell test before the component exists.
6. Push and verify CI/test failure is caused by the missing `BootstrapShell` implementation, not configuration mistakes.

## Task 2 — GREEN isolated shell

**Files:** `src/app/shell/BootstrapShell.tsx`, `src/app/shell/bootstrap-shell.css`, `entrypoints/chatspace.content.tsx`

1. Implement the minimal component needed by the failing test.
2. Mount it through WXT `createShadowRootUi`.
3. Use `cssInjectionMode: 'ui'`, `position: 'inline'`, `anchor: 'body'`, and a unique kebab-case root name.
4. Return the React root from `onMount` and unmount it in `onRemove`.
5. Keep the shell visually unobtrusive and host-independent.
6. Run test, typecheck, lint, and build.

## Task 3 — Fast CI and repository hygiene

**Files:** `.github/workflows/ci.yml`, `.gitignore`, `README.md`

1. CI on pushes to `master` and pull requests.
2. Use Node 22 and npm dependency cache where a lockfile exists; until lockfile creation is available, install exact top-level versions with `npm install`.
3. Run `npm run verify` and `npm run build` as distinct evidence-producing steps.
4. Ignore WXT/build/node artifacts.
5. Document local commands and Chrome unpacked-extension workflow.

## Task 4 — Verification and state handoff

1. Inspect branch diff for scope leakage.
2. Verify the latest workflow run for the head commit.
3. Confirm no provider/extraction code exists.
4. Update `.agent/STATE.md` with exact evidence and next single priority.
5. Open a focused PR, review changed files, then squash-merge only if all available checks are green.

## Definition of Done

- WXT extension builds successfully.
- TypeScript strict check passes.
- ESLint passes.
- Vitest bootstrap behavior test passes.
- Content script is limited to `https://chatgpt.com/*` and mounts an isolated Shadow DOM shell.
- No live ChatGPT dependency in automated tests.
- CI is present and green on the final branch head.
- `.agent/STATE.md` reports evidence and does not claim later features.
