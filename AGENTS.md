# Chatspace Canonical Agent Workflow

This file is the **canonical execution contract for every coding agent** working on Chatspace: Codex, Claude Code, GPT web, GitHub/IDE agents, and future agents.

Agent-specific instruction files may only be thin adapters that point here and add tool-specific behavior. They must not redefine the development lifecycle or duplicate project knowledge.

Detailed product/architecture/testing/security context lives in `.agent/` and is loaded only when the task needs it.

## Objective

Optimize for:

```text
validated user value
-------------------------------
engineering time + cognitive load + compute cost + agent/context cost
```

Production quality is required. Architectural sophistication is not a goal.

## Product authority — hard rule

**The user owns product decisions. Agents own implementation within the approved product scope.**

- Do not introduce a new feature, capability, workflow, product behavior, or product requirement unless the user explicitly requested it or it is already an approved requirement.
- Do not expand scope because something is fashionable, convenient, architecturally elegant, or considered a general best practice.
- Do not silently invent missing product requirements. Surface the missing requirement/decision and keep implementation inside the part that is actually approved.
- Implementation recommendations are allowed when they help satisfy an approved requirement.
- Product recommendations are not implementation authority. Treat them as proposals only, and make them only when the user explicitly asks for product advice/options.
- Existing product requirements, acceptance criteria, and durable decisions remain authoritative until the user changes them.
- If repository behavior and an explicit current user requirement conflict, the user requirement is the product authority, but apply the escalation rules below before making a destructive or contract-breaking change.

Authority model:

```text
User / Product Authority
        |
        | approved requirement
        v
Problem -> Vertical Slice -> Agent Implementation
                              |
                              v
                         Code + Tests
                              |
                              v
                         Verification
                              |
                         evidence/result
                              v
                      User accepts/revises
```

## Minimum Context Principle

Read in this order:

```text
task
-> AGENTS.md
-> .agent/STATE.md
-> affected source/tests
-> task-relevant .agent documents only
```

Do not recursively read the repository or preload every `.agent` document.

Use `.agent/README.md` only to route to the minimum relevant project context.

## Canonical lifecycle

```text
1. Understand requested outcome
2. Read minimum relevant context
3. Inspect current behavior/repository state
4. Define 1-3 observable acceptance criteria + non-goals + risk + evidence
5. Identify affected contracts/boundaries before parallel or cross-layer work
6. Choose the smallest vertical change that can satisfy the approved requirement
7. RED/reproduce when behavior is deterministic
8. Implement minimum GREEN change
9. Refactor touched complexity only while green
10. Run targeted verification
11. Run the required pre-merge gate
12. Update only operational state/docs made stale by the change
13. Stop
```

Do not create a giant plan for a bounded task. Architecture work is justified only by the triggers in `.agent/SYSTEM.md`.

## Implementation rule — hard rule

- Prefer the smallest vertical slice that produces observable user value or proves the requested behavior end-to-end.
- Reuse existing patterns and boundaries before introducing new architecture.
- Do not create abstractions until required by the current implementation or a demonstrated stable pattern/boundary.
- Do not refactor unrelated code.
- Do not modify unrelated behavior.
- Do not build horizontal layers independently when the requested behavior can be proven with a thinner vertical slice.
- For work spanning multiple components, establish the shared contract first; frontend/backend/agents must not independently invent incompatible assumptions.
- Preserve good boundaries when they provide real domain isolation, security, testability, failure isolation, or ownership clarity.
- Prefer explicit, boring code over speculative extensibility.

## Verification levels

### Local fast loop

Use the cheapest high-signal check while developing:

```bash
pnpm exec vitest run <affected-test>
pnpm exec eslint <touched-files>
```

Run only what is useful for the current RED/GREEN loop. Do not run the full suite after every edit.

### Pre-merge

Run once the intended outcome is complete:

```bash
pnpm verify
pnpm build
pnpm zip
```

Add explicit manual acceptance when browser/provider/UI behavior cannot be proven by CI.

### Release

Follow `.agent/ENGINEERING.md` + `.agent/DELIVERY.md`. Release validation is not part of every local iteration.

## Non-negotiable defaults

- one logical outcome = one short-lived branch + one PR
- keep `master` releasable
- prefer small vertical slices over layer-by-layer scaffolding
- use evidence for behavior claims; never declare success from inspection alone
- acceptance criteria define done; agent confidence does not
- no speculative abstraction, framework, dependency, service layer, registry, event bus, DI container, agent framework, or infrastructure
- no unrelated refactor/cleanup in a feature or bug-fix task
- preserve good existing boundaries for domain isolation, security, testability, and failure isolation
- delete dead code only after references/ownership/replacement are understood
- never delete requirements, architecture, plans, testing rationale, security constraints, delivery context, or durable decisions as “legacy workflow”
- never use private/undocumented ChatGPT APIs, provider cookies/session tokens, automated content extraction, scraping, network replay, or protection bypasses
- parallel agents are optional only for truly independent work; one owner integrates shared contracts
- prefer a small releasable outcome over a giant feature batch

## Agent cost discipline

Treat these as waste unless evidence says otherwise:

- repeated full-repository scans
- duplicated instruction loading
- repeated architecture analysis for ordinary feature work
- large speculative plans
- repeated full builds/tests during the local loop
- unnecessary generated markdown/status reports
- multiple agents editing the same contract
- continuing after acceptance is satisfied

Prefer reusing known project state and focused source/tests over rediscovery.

## Stop and escalation conditions — hard rule

### Stop because the task is complete

Stop implementation when:

- requested behavior works
- relevant tests/evidence pass
- required gate passes
- required manual acceptance is recorded
- no blocker remains inside accepted scope

Do **not** continue into optional refactoring, aesthetic cleanup, future-proofing, documentation expansion, dependency changes, architecture redesign, or adjacent feature work.

If a useful follow-up exists, record at most a short follow-up note and end the task.

### Stop and surface the issue before changing the contract

Do not silently proceed when any of these is required:

- the requested requirement contradicts existing approved behavior or another active requirement
- a destructive or irreversible data migration is required
- a public/user-visible contract or persisted compatibility contract must break
- a security, privacy, permission, trust, or provider boundary must change
- a major/cross-cutting architecture change is necessary
- the requirement is materially incomplete and choosing an assumption would create new product behavior

In these cases, surface:

```text
Conflict / required decision:
Why current implementation cannot safely satisfy both:
Smallest viable options:
Impact / migration / compatibility risk:
Recommended implementation option (if useful):
```

Do not turn an implementation recommendation into an unapproved product decision.

### Stop and reopen the engineering model

Reassess before continuing when:

- scope starts expanding beyond acceptance criteria
- three patch attempts fail without a stronger root-cause hypothesis
- provider/security assumptions are uncertain
- a bounded task unexpectedly requires a new cross-cutting architecture boundary

## Do / Don't

| Do | Don't |
|---|---|
| problem first | framework first |
| explicit approved requirement | AI-generated product scope |
| minimal architecture | speculative architecture |
| define shared contract first | frontend/backend/agents independently improvising contracts |
| vertical slices | horizontal layer construction by default |
| observable acceptance criteria | vague “done” |
| inspect existing code and behavior | rewrite unnecessarily |
| reuse existing patterns | abstraction by default |
| test observable behavior/contracts | test implementation trivia |
| small release-ready outcome | giant feature batch |
| evidence from tests/build/manual acceptance | agent self-confidence |
| surface missing product decisions | silently invent requirements |
| implementation recommendations within scope | unrequested product decisions |

## Project context routing

Use `.agent/README.md` to locate project knowledge. Workflow rules live here and in `.agent/ENGINEERING.md`; project knowledge must not be duplicated into agent-specific files.
