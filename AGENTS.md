# Chatspace Product & Engineering Operating Rules

This file is the **single canonical execution contract** for every coding agent working on Chatspace: Codex, Claude Code, GPT web, GitHub/IDE agents, and future agents.

`.agent/` stores project knowledge and detailed engineering policy. It must not define a competing lifecycle. Agent-specific files may only point here and add tool-specific behavior.

## 1. Operating principle

Optimize for:

```text
validated user value
-------------------------------
engineering time + waiting + rework + cognitive load + compute/context cost
```

Production quality is required. Architecture sophistication, test volume, documentation volume, and process ceremony are not goals.

The operating model is:

```text
high autonomy in local engineering execution
low autonomy in product and material architecture decisions
```

## 2. Product authority — hard rule

The user owns:

- WHY / product problem and intent
- WHAT / product behavior and semantics
- product scope and non-goals
- material architecture boundaries
- final approve / reject / release / change-direction decisions

The agent may analyze, surface evidence, identify risks, recommend implementation approaches, and draft acceptance criteria from an already clear requirement. It must not:

- invent a product requirement
- add a feature/capability/workflow because it seems useful or best practice
- silently reinterpret material ambiguity
- expand scope through acceptance criteria
- treat a recommendation, observation, or feedback item as authorization

Existing approved requirements and durable decisions remain authoritative until explicitly changed.

## 3. Engineering autonomy

Inside approved scope and existing material boundaries, the agent should execute ordinary local engineering decisions autonomously. Do not request approval for normal implementation choices such as:

- naming and file placement consistent with existing conventions
- implementation sequencing
- local code structure
- reuse of an existing pattern/component
- a small local abstraction justified by the current change
- touched-only refactoring
- risk-appropriate verification selection
- ordinary error handling and internal implementation details

Prefer making the smallest sound local decision and continuing.

Explicit user approval is required before materially changing:

- service/runtime boundaries
- data ownership
- public/user-visible APIs or persisted compatibility contracts
- communication patterns between major components/services
- consistency model
- security/privacy/permission/trust boundaries
- infrastructure architecture
- destructive or irreversible data behavior
- another major cross-cutting architecture boundary

## 4. Minimum context principle

Default read path:

```text
task
-> AGENTS.md
-> .agent/STATE.md
-> affected source/tests
-> only task-relevant .agent documents
```

Use `.agent/README.md` as a context router. Do not recursively scan the repository or preload all `.agent` documents for an ordinary bounded task.

## 5. Canonical lifecycle

```text
USER INTENT
    ↓
UNDERSTAND
    ↓
BOUND
    ↓
SPECIFY
    ↓
DESIGN
    ↓
IMPLEMENT
    ↓
VERIFY
    ↓
QUALITY GATES
    ↓
RELEASE READY
    ↓
STOP
```

This is the only canonical development lifecycle. Detailed documents explain specific concerns; they do not redefine this sequence.

### USER INTENT

Start from the explicit user request or already-approved requirement.

- preserve the requested outcome
- do not add adjacent product scope
- distinguish a request for implementation from a request for product recommendations

### UNDERSTAND

Separate:

```text
Problem:
Proposed solution, if any:
Explicit requirement:
Current behavior / relevant repository state:
```

Inspect only enough existing code/context to understand the affected behavior and ownership.

When product uncertainty materially affects what should be built, identify the **minimum evidence** needed to resolve it. Do not create a broad research phase for ordinary implementation work.

### BOUND

Define the smallest safe change boundary:

- in-scope behavior
- non-goals
- affected ownership/boundaries
- any decision that crosses a product/material-architecture approval boundary

Do not silently choose through a material ambiguity. Surface only the decision that actually blocks safe execution; continue autonomously on unaffected local work.

### SPECIFY

Turn the approved product decision into implementation-ready expectations:

```text
Expected outcome:
Explicit requirements:
1-3 observable acceptance criteria:
Relevant constraints/non-goals:
```

Acceptance criteria may be drafted by the agent when they directly restate an explicit requirement or existing approved behavior. They must not create new product semantics or expand scope.

### DESIGN

Design only as far as needed for the current requirement.

Before introducing a new design, determine:

1. What behavior must change?
2. Which existing component/module owns that behavior?
3. Can the requirement use the current architecture and patterns?
4. What is the smallest design with the lowest justified blast radius?

Prefer, in order:

```text
reuse existing pattern
-> extend existing owner/component
-> introduce a small local abstraction
-> change architecture only when existing architecture cannot reasonably satisfy the requirement
```

When several designs satisfy the requirement, prefer lower coupling, smaller change surface, fewer dependencies/abstractions, lower migration cost, easier reversibility, and clearer ownership.

Do not introduce architecture for hypothetical scale, flexibility, reuse, or future requirements. Follow `.agent/SYSTEM.md` for material design boundaries.

### IMPLEMENT

Implement the smallest vertical change that satisfies the specification.

- preserve current boundaries unless the approved design changes them
- avoid unrelated refactoring/cleanup
- do not build frontend/backend/layers independently around guessed contracts
- define the shared contract first when multiple components must coordinate
- prefer explicit boring code over speculative extensibility
- refactor touched complexity only when it improves the current change

### VERIFY

Verification is risk-based.

For every change:

```text
realistic failure
      ↓
impact + likelihood
      ↓
cheapest high-signal verification
      ↓
broaden only when risk requires it
      ↓
sufficient change confidence
```

Tests exist to reduce meaningful delivery risk, not to maximize coverage/test count or enforce ceremony.

Use TDD when a deterministic automated test is the cheapest high-signal way to define or protect important behavior. Do not require TDD for presentation-only changes, styling/layout, static markup, copy, trivial wiring, exploratory implementation, or cases better verified another way.

Before adding or running a test/check, ask:

> What realistic regression or failure does this detect?

Before adding a broader layer, ask:

> Is this already protected more cheaply elsewhere?

Detailed policy lives in `.agent/TESTING.md`.

### QUALITY GATES

Risk-based verification does not remove repository quality gates.

Before merge, satisfy the checks actually required by the repository/CI for the changed codebase, such as lint, strict type checking, deterministic tests, build/package checks, or other configured checks.

Do not mechanically duplicate all CI commands locally after every edit. Use fast targeted feedback during development, then let required quality gates provide merge confidence.

A failing required gate is not optional merely because the local risk classification was low.

### RELEASE READY

A merged change should be the smallest complete increment that can safely remain on releasable `master`.

Before calling an increment release-ready:

- acceptance criteria are satisfied
- risk-appropriate evidence exists
- required quality gates pass
- only docs/state made stale by the change are updated
- no accidental debug/dead code remains in the touched slice
- release-specific checks are performed only when this is actually a release candidate or the changed risk requires them

If evaluating the expected product outcome requires instrumentation, decide whether instrumentation is necessary before release. Instrumentation is **not mandatory by default** and must not collect provider content or create unapproved telemetry.

### STOP

Stop when the approved scope is satisfied, verification is sufficient, required gates pass, and no material issue remains inside scope.

Do not continue into:

- optional cleanup
- aesthetic refactoring
- future-proofing
- speculative optimization
- new dependencies/architecture
- adjacent features
- extra tests without meaningful risk reduction
- unnecessary status/report documents

A useful follow-up may be recorded briefly as a separate task; it is not part of the completed change.

## 6. Product-learning loop after release

The development lifecycle ends at STOP. When a released change is being evaluated as a product decision, use this separate learning loop only when relevant:

```text
PRODUCT DECISION
-> REQUIREMENT
-> canonical development lifecycle
-> RELEASE
-> OBSERVE
-> EVIDENCE
-> KEEP / ITERATE / REVERT / REMOVE / INVESTIGATE
-> USER DECISION
```

Observe only signals relevant to the expected outcome, potentially including:

- technical health
- user behavior
- product outcome

Do not invent instrumentation or a metrics program just to satisfy this loop. The user owns the final product decision.

## 7. Git and release defaults

- one logical outcome = one short-lived branch + one PR
- branch from current `master`
- keep concurrent WIP low
- prefer squash merge
- keep `master` releasable
- no long-lived release branch by default
- release the smallest complete accepted increment
- no unrelated feature code in a release-only change

Detailed repository release policy lives in `.agent/ENGINEERING.md` and `.agent/DELIVERY.md`.

## 8. Stop and escalation conditions

Surface a decision before proceeding when the change requires:

- inventing material product behavior because a requirement is incomplete
- reconciling contradictory approved requirements
- destructive/irreversible migration or data behavior
- breaking a public/user-visible or persisted compatibility contract
- changing security/privacy/permission/trust/provider boundaries
- changing data ownership or another material architecture boundary
- an unsafe provider mechanism or unsupported capability

When escalation is needed, keep it narrow:

```text
Required decision:
Why it blocks safe execution:
Smallest viable options:
Material impact/risk:
Recommended implementation option, if useful:
```

Do not turn an implementation recommendation into an unapproved product decision.

Reassess the engineering model before another patch when three implementation attempts fail without a stronger root-cause hypothesis or when verification expands significantly without a clearer failure model.

## 9. Do / Don't

| Do | Don't |
|---|---|
| start from explicit user intent | generate adjacent product scope |
| separate problem / proposed solution / requirement | treat proposed solution as automatically correct requirement |
| bound the smallest safe change | conduct mandatory repo-wide reconnaissance |
| draft AC from approved behavior | invent product semantics through AC |
| reuse current owner/pattern | redesign architecture by default |
| make ordinary local engineering decisions autonomously | ask approval for trivial implementation details |
| escalate material architecture/product decisions | silently change boundaries |
| vertical slices | horizontal scaffolding by default |
| risk-based verification | run every possible test by habit |
| cheapest high-signal evidence | duplicate confidence across layers |
| required quality gates before merge | confuse local fast loop with merge gates |
| smallest complete release-ready increment | giant feature batch |
| stop when done | continue into optional future-proofing |

## 10. Project-context routing

`.agent/README.md` identifies the authoritative project document for product, architecture, code patterns, testing, security, design, delivery, state, and durable decisions.

Project knowledge must be preserved when workflow/process rules are cleaned up. Never delete requirements, architecture, plans/rationale, security constraints, testing rationale, delivery context, or durable decisions merely because they are old; mark them completed/superseded when appropriate.
