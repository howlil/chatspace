# Chatspace Product & Engineering Operating Rules

This file is the **single canonical execution contract** for every coding agent working on Chatspace: Codex, Claude Code, GPT web, GitHub/IDE agents, and future agents.

`.agent/` stores project knowledge, current iteration state, and detailed engineering policy. It must not define a competing lifecycle. Agent-specific files may only point here and add tool-specific behavior.

## 1. Operating principle

Optimize for:

```text
validated user value
-------------------------------
engineering time + waiting + rework + cognitive load + compute/context cost
```

Production quality is required. Architecture sophistication, test volume, documentation volume, planning ceremony, branch count, and PR count are not goals.

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
- architecture boundaries
- acceptance criteria when they introduce or change observable semantics
- public/persisted contracts, data ownership, and security/trust boundaries
- final approve / reject / release / change-direction decisions

The agent owns ordinary implementation decisions inside approved boundaries: repository inspection, local design, coding, testing, debugging, verification, touched-only refactoring, and quality gates.

The agent must not:

- invent a product requirement
- add adjacent capability because it seems useful or best practice
- silently reinterpret material ambiguity
- expand scope through acceptance criteria
- treat a recommendation, observation, or backlog candidate as authorization

Existing approved requirements and durable decisions remain authoritative until explicitly changed.

Explicit user approval is required before materially changing:

- service/runtime boundaries
- data ownership
- public/user-visible APIs or persisted compatibility contracts
- communication or consistency models between major components
- security/privacy/permission/trust boundaries
- infrastructure architecture
- destructive or irreversible data behavior
- another major cross-cutting architecture boundary

## 3. Minimum-context principle

Default read path:

```text
task
-> AGENTS.md
-> .agent/CURRENT_ITERATION.md
-> affected source/tests
-> only task-relevant .agent documents
```

Read `.agent/STATE.md` only when broader project-state/history is needed. Use `.agent/README.md` as the context router. Do not recursively scan the repository or preload all `.agent` documents for an ordinary bounded task.

Conversation history is context, not the source of truth for active engineering state.

## 4. Delivery lifecycle

Plan at **milestone boundaries**. Execute continuously at **slice boundaries**. Integrate at **logical-change boundaries**.

```text
USER INTENT
    ↓
UNDERSTAND
    ↓
BOUND
    ↓
MILESTONE PLAN
    ↓
EXECUTE SLICES CONTINUOUSLY
    ↓
MILESTONE GATE
    ↓
RELEASE READY
    ↓
STOP
```

This is the default delivery lifecycle. Do not re-plan the whole milestone after every slice unless evidence materially changes scope, constraints, or the chosen product/architecture boundary.

Inside `EXECUTE SLICES CONTINUOUSLY`, use the engineering loop as needed:

```text
SPECIFY -> DESIGN -> IMPLEMENT -> VERIFY -> QUALITY GATES -> INTEGRATE
```

Stages may be fused for small, clear work. The lifecycle is guidance for control and evidence, not mandatory ceremony.

## 5. Work hierarchy

```text
Milestone -> Slice -> Logical Change -> Commit
```

### Milestone

A bounded meaningful product, engineering, reliability, migration, or release outcome worth planning as a whole.

A milestone plan must define only what is needed to execute safely:

```text
WHY / desired outcome
in-scope and non-goals
material constraints/boundaries
observable milestone acceptance
ordered slices
known risks/blockers
milestone gate
```

Do not create a sprint plan for every small change inside a milestone.

### Slice

A coherent vertical step that advances the milestone and can be verified independently. A slice is an execution boundary, not automatically a branch, PR, release, or new planning ceremony.

### Logical Change

The smallest coherent integration/review unit. Integrate it as soon as it is correct, sufficiently verified, and required gates pass. Do not hold verified logical changes until the entire milestone is finished.

### Commit

A checkpoint inside a logical change. Commit boundaries should help reasoning/recovery; they are not product planning units.

## 6. Milestone planning and active iteration state

`.agent/CURRENT_ITERATION.md` is the canonical source of truth for the active meaningful iteration/milestone.

It must make these questions cheap to answer:

- What are we building and why?
- What does the intended feature/outcome look like?
- What is inside and outside scope?
- Which slice is active?
- What has already been completed?
- What evidence exists?
- What is the single next meaningful action?

Use the compact orientation model:

```text
Feature Shape -> Current Position -> Delta -> Next Move
```

Update `CURRENT_ITERATION.md` when meaningful iteration state changes: milestone starts, a slice completes, scope materially changes by user decision, evidence changes the next move, the milestone gate completes, or work becomes blocked.

Do not update it after every trivial edit or commit.

`.agent/STATE.md` is broader project/operational knowledge and history. It is not the active iteration source and must not compete with `CURRENT_ITERATION.md`.

## 7. Slice execution

For each slice:

### UNDERSTAND / SPECIFY

Start from the milestone outcome and explicit user requirement. Define only the observable delta needed for this slice.

Acceptance criteria may be drafted by the agent when they directly restate approved behavior. They must not create new product semantics.

### DESIGN

Determine:

1. What behavior must change?
2. Which existing owner/component owns it?
3. Can current architecture/patterns satisfy it?
4. What is the smallest low-blast-radius design?

Preference order:

```text
reuse existing pattern
-> extend existing owner/component
-> small local abstraction
-> new component when ownership requires it
-> architecture change only when necessary and approved
```

No speculative abstractions, framework-first design, or future-proofing.

### IMPLEMENT

Implement the smallest coherent vertical change.

- preserve current boundaries unless explicitly approved otherwise
- avoid unrelated cleanup/refactoring
- define shared contracts before coordinating multiple components
- prefer explicit boring code over speculative extensibility
- refactor only touched complexity that materially improves the current change

### VERIFY

Verification is risk-based:

```text
realistic failure
-> impact + likelihood
-> cheapest high-signal evidence
-> broaden only when risk requires it
```

Before adding/running a check, ask what realistic regression it detects. TDD is useful when a deterministic automated test is the cheapest high-signal way to define/protect behavior; it is not mandatory for presentation-only changes, static copy, trivial wiring, or cases better verified another way.

Detailed policy lives in `.agent/TESTING.md`.

### QUALITY GATES

Required repository/CI gates remain mandatory before integration/merge where applicable. Local fast feedback and merge gates are different concerns; do not mechanically run the entire CI surface after every edit.

### INTEGRATE

Integrate verified logical changes continuously.

Branch and PR are **integration mechanisms, not planning units**:

- do not create a branch per file, layer, agent, micro-task, or every slice by default
- do not keep a milestone in one giant long-lived branch
- use a short-lived branch/PR when repository policy, review, CI, risk, or collaboration benefits from it
- one branch/PR may contain the commits needed for one coherent logical change
- when safe direct integration is permitted, a tiny low-risk logical change does not require artificial branch churn
- prefer squash merge for PR-based logical changes unless history needs otherwise
- keep `master` releasable
- recheck after meaningful base movement

The goal is small-batch integration with low WIP and low delivery latency.

## 8. Milestone gate

Run a milestone gate after the planned slices are complete, not after every slice.

Check:

- milestone acceptance is satisfied
- all intended slices are integrated or explicitly removed from scope by user decision
- no known material blocker remains inside scope
- required quality gates for the integrated code are green
- relevant project/state/docs are current
- release-specific checks are performed only when this is actually a release candidate or the risk requires them

If the gate fails, identify the smallest missing slice or decision. Do not restart planning from zero.

## 9. Release ready and stop

A release-ready increment is the smallest complete accepted outcome that can safely remain on releasable `master`.

Stop when:

- approved scope is satisfied
- verification is sufficient
- required gates pass
- milestone state is current
- no material issue remains inside scope

Do not continue into optional cleanup, aesthetic refactoring, future-proofing, speculative optimization, new dependencies, adjacent features, or redundant tests.

Useful follow-up work may be recorded briefly as a candidate; it is not authorized implementation.

## 10. Retrospective rule

Retrospective is evidence-driven improvement, not a recurring ceremony.

Use:

```text
Evidence -> Bottleneck -> Root Cause -> Small Improvement -> Verify
```

Run a retrospective when:

- a meaningful milestone/release finishes
- delivery was materially slower than expected
- significant rework occurred
- a production failure/repeated defect occurred
- the same engineering friction repeats
- the user explicitly requests one

Do not run a retrospective after every trivial slice/change.

Evidence may include diff/batch size, PR/review cycles, CI/build failures, defects, repeated debugging, rework, waiting time, unnecessary abstraction/dependencies, agent/tool loops, context waste, duplicated work, user corrections, and acceptance failures.

Adopt at most the smallest process/code/tool improvement justified by the evidence; verify whether it actually reduces the bottleneck.

## 11. Product-learning loop after release

The development lifecycle ends at STOP. When a released change is being evaluated as a product decision, use this separate loop only when relevant:

```text
RELEASE -> OBSERVE -> EVIDENCE -> KEEP / ITERATE / REVERT / REMOVE / INVESTIGATE -> USER DECISION
```

Observe only signals relevant to the expected outcome. Instrumentation is optional and must never be added merely to satisfy process. Any remote telemetry requires explicit product/privacy consideration and must not collect provider conversation content.

## 12. Stop and escalation conditions

Surface a decision before proceeding when the change requires:

- inventing material product behavior because a requirement is incomplete
- reconciling contradictory approved requirements
- destructive/irreversible migration or data behavior
- breaking a public/user-visible or persisted compatibility contract
- changing security/privacy/permission/trust/provider boundaries
- changing data ownership or another material architecture boundary
- an unsafe provider mechanism or unsupported capability

Keep escalation narrow:

```text
Required decision:
Why it blocks safe execution:
Smallest viable options:
Material impact/risk:
Recommended implementation option, if useful:
```

Three failed implementation attempts without a stronger root-cause hypothesis trigger model reassessment rather than another blind patch.

## 13. Do / Don't

| Do | Don't |
|---|---|
| plan a bounded milestone once | re-plan every slice as a new sprint |
| execute vertical slices continuously | turn each slice into process ceremony |
| integrate at logical-change boundaries | batch the entire milestone before integration |
| keep one canonical active iteration file | depend on chat history for current position |
| use Feature Shape -> Position -> Delta -> Next Move | dump full project history into every update |
| start from explicit user intent | generate adjacent product scope |
| reuse current owner/pattern | redesign architecture by default |
| make local engineering decisions autonomously | ask approval for trivial implementation details |
| escalate material product/architecture decisions | silently change boundaries |
| risk-based verification + required gates | maximize test/check volume |
| retrospective from evidence when useful | mandatory retrospective per small change |
| stop when accepted scope is done | continue into optional future-proofing |

## 14. Project-context routing

`.agent/README.md` identifies the authoritative project document for product, architecture, code patterns, testing, security, design, delivery, active iteration, broader state, and durable decisions.

Project knowledge must be preserved when workflow/process rules are cleaned up. Never delete requirements, architecture, plans/rationale, security constraints, testing rationale, delivery context, or durable decisions merely because they are old; mark them completed/superseded when appropriate.
