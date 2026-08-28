# Iteration 0 Bootstrap Implementation Plan

> **Status: Completed / Historical / Superseded as current instruction.**
>
> This document is preserved as project history and rationale. Do **not** use its npm, content-script, Shadow DOM, mandatory RED/TDD, old workflow-file references, or fixed CI-gate instructions as current operating rules. Current authority is `AGENTS.md`, current runtime architecture is `.agent/ARCHITECTURE.md`, and current verification policy is `.agent/TESTING.md`.
>
> Later decisions moved the product to a browser Side Panel, `chrome.storage.local`, URL-only `browser.tabs` provider integration with no ChatGPT content script, pnpm, and risk-based verification.

> Historical instruction at the time: implement task-by-task with RED → GREEN → REFACTOR and fresh verification before completion claims.

**Historical Goal:** Establish the smallest reproducible Chatspace browser-extension foundation that can mount/unmount an isolated React shell on an explicitly supported host page and pass lint, typecheck, test, and build in CI.

**Historical Architecture:** Chromium Manifest V3 extension built with WXT. The content script owned only a Shadow DOM-isolated Chatspace shell; provider-specific behavior was intentionally absent from Iteration 0. React rendered one harmless status surface. This architecture was later superseded by the Side Panel + browser-tabs design.

**Historical Tech Stack:** Node >=22.12, npm 12.0.2, WXT 0.21.4, React 19.2.8, TypeScript 6.0.3, ESLint 10.9.0 + typescript-eslint 8.67.0, Vitest 4.1.11, Testing Library, jsdom 30.0.1.

**Historical Spec references:** `.agent/STATE.md`, `.agent/ARCHITECTURE.md`, deleted legacy workflow docs, `.agent/TESTING.md`.

## Historical Global Constraints

- Chromium Manifest V3 first.
- Exact package versions in `package.json`; generate and commit the package-manager lockfile as soon as available.
- WXT requires Node >=22 for v0.21.x.
- React is enabled through `@wxt-dev/module-react`.
- Content UI originally used WXT `createShadowRootUi`; this is no longer the current primary UI architecture.
- The old content script matched `https://chatgpt.com/*`; the core current path no longer uses a ChatGPT content script.
- No ChatGPT DOM scraping, private endpoints, auth/session access, or conversation extraction.
- Tests must not require live ChatGPT.

---

## Historical Task 1 — Reproducible toolchain and RED bootstrap test

**Files at the time:** `package.json`, `tsconfig.json`, `wxt.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `tests/setup.ts`, `src/app/shell/BootstrapShell.test.tsx`

**Behavior under test at the time:** the bootstrap shell exposed a visible `Chatspace` label and a non-interactive `Foundation ready` status.

1. Add exact dependency versions and scripts.
2. Configure WXT React module and minimal MV3 manifest metadata.
3. Configure strict TypeScript.
4. Configure Vitest + jsdom and ESLint.
5. Write the shell test before the component existed.
6. Verify failure was caused by missing implementation rather than configuration.

The bootstrap test was later removed after the bootstrap shell stopped protecting an active runtime behavior.

## Historical Task 2 — GREEN isolated shell

**Files at the time:** `src/app/shell/BootstrapShell.tsx`, bootstrap CSS, old ChatGPT content-script entrypoint.

1. Implement the minimal bootstrap component.
2. Mount through WXT isolated content UI.
3. Keep the shell host-independent.
4. Unmount cleanly.
5. Keep the shell visually unobtrusive.
6. Run the then-required verification.

This content-script UI design was later superseded by the Side Panel architecture.

## Historical Task 3 — Fast CI and repository hygiene

1. CI on pushes to `master` and pull requests.
2. The project originally planned npm; pnpm later became canonical.
3. The original plan treated build as a separate CI step; current CI uses WXT ZIP as the single build+package gate where appropriate.
4. Ignore generated build artifacts.
5. Document local commands and unpacked-extension workflow.

## Historical Task 4 — Verification and state handoff

1. Inspect branch diff for scope leakage.
2. Verify the latest workflow run.
3. Confirm no unsupported provider/extraction code.
4. Update operational state.
5. Open a focused PR and integrate only after required checks.

## Historical Definition of Done

At the time this plan was completed:

- the WXT extension foundation built successfully
- strict TypeScript / ESLint / Vitest foundation checks existed
- provider extraction/private API behavior was absent
- CI existed
- project state captured the next iteration

Later architecture/product decisions supersede the original content-script/bootstrap details while this plan remains preserved as historical rationale.
