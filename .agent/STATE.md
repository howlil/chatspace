# Current Project State

Last updated: 2026-08-25

## Current

Agent operating model is established on `master` through PR #1 (`chore: establish Chatspace agent operating model`).

The repository started empty. No production extension code, package manifest, CI, test runner, or runtime implementation exists yet.

## Last merged outcome

The repository now has:

- root `AGENTS.md` router
- product scope and MVP boundaries
- browser-extension architecture and provider compatibility boundary
- pragmatic TypeScript/React code patterns
- compact Obsidian/IDE-inspired design rules
- TDD iteration workflow and git/PR discipline
- staged delivery roadmap through v1.0
- local-fixture testing strategy
- security/privacy/compliance constraints
- quality/merge/release gates
- agent roles and coordination rules
- architecture decision log
- task-specific skills for architecture, feature delivery, debugging, UI, provider compatibility, refactor, research, review, and release

## Product direction accepted

- desktop browser extension
- Obsidian/IDE-inspired three-panel workspace
- ChatGPT/provider web experience remains the intelligence/conversation owner
- Chatspace owns local organization/navigation state
- nested folders, tabs, local notes, graph projections are core workspace primitives
- graph must be a useful navigation surface, not decoration
- Obsidian/filesystem bridge is later, conditional work

## Hard constraints

- no undocumented/private ChatGPT endpoints
- no auth/session-cookie reuse
- no automated/programmatic extraction of ChatGPT data/output
- no protection/rate-limit bypass
- provider-specific logic isolated in compatibility adapter
- host page must remain usable if Chatspace fails/disabled
- TDD for behavior changes
- evidence before completion claims

## Architecture baseline

Proposed for Iteration 0 validation:

- WXT
- Chromium Manifest V3
- TypeScript strict
- React
- local IndexedDB behind repository abstraction
- Vitest + Testing Library
- Playwright for controlled extension E2E
- React Flow only when graph iteration begins

## Verification evidence

- PR #1 merged into `master`
- `.agent/` directory is present on `master` with the planned operating documents and `skills/`
- placeholder scan of the PR patch found only rule text referring to `TODO/TBD`, not unfinished plan placeholders
- current OpenAI Terms of Use were checked during planning and the provider compliance boundary is documented

## Not implemented / not verified

- project bootstrap
- extension load
- tests/build/typecheck/lint
- ChatGPT host coexistence
- provider adapter
- persistence
- UI design implementation
- graph
- notes
- CI/CD

Do not claim any of these are working.

## Next single priority

**Iteration 0 — Repository bootstrap.**

Create the smallest WXT + React + strict TypeScript extension that:

1. builds reproducibly
2. has a real RED/GREEN bootstrap test flow
3. mounts/unmounts a harmless isolated Chatspace root on an explicitly supported host page
4. has fast CI for lint/typecheck/test/build

Do not implement folders/tabs/graph during bootstrap.

## First implementation design questions to resolve during Iteration 0

- exact package manager/version policy
- Shadow DOM integration pattern in WXT content script
- minimal host permissions/origin list
- test harness for local host fixtures
- extension development/install instructions

Resolve with the smallest working evidence; avoid speculative platform design.

## Known risks

- provider web UI changes can break compatibility assumptions; all such knowledge must stay inside the adapter
- desired semantic/graph capabilities may remain constrained until a provider-supported data path exists
- extension permissions and host coexistence must be validated before workspace features build on the shell

## Compatibility state

Not implemented. No provider adapter exists yet.

## Blocked

No technical blocker is known for Iteration 0.

Provider capabilities beyond safe UI coexistence/navigation remain policy-dependent and must be reviewed per feature.

## State update template

After each meaningful merge replace/update sections above with:

```text
Current:
Last merged outcome:
Verification evidence:
Known defects/risks:
Compatibility state:
Next single priority:
Blocked:
```
