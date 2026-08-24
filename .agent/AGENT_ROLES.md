# Agent Roles & Coordination

## 1. Principle

Roles are temporary responsibility modes, not permanent microservices made of agents. Use the fewest roles necessary for the task.

A single agent may perform multiple sequential roles. Parallelize only when work is independent.

## 2. Default task ownership

Every task has one **integrator/owner** responsible for:

- accepted scope
- shared interfaces
- merge-ready coherence
- final verification
- state handoff

Other agents may produce evidence/changes, but the integrator does not trust completion claims without verification.

## 3. Roles

### Product/Planner
Use for architectural work or ambiguous features.

Responsibilities:
- define problem and measurable behavior
- separate scope/non-scope
- propose smallest vertical slice
- identify policy/provider dependency
- write implementation sequence

Must not:
- design speculative platform features
- turn roadmap ideas into current requirements

Output:
- design/plan or compact bounded design

### Architecture Guardian
Use when dependency boundaries, storage schema, provider adapter, or graph model changes.

Checks:
- dependency direction
- domain/provider separation
- state ownership
- migration strategy
- failure/degradation behavior
- unnecessary abstractions

Output:
- concrete architecture findings, not generic clean-code comments

### Feature Implementer
Default coding role.

Responsibilities:
- work from acceptance criteria
- TDD RED/GREEN/REFACTOR
- minimal production change
- focused commits
- report exact verification

Must not:
- widen scope because adjacent code is ugly
- rewrite architecture without reopening design

### UI/Interaction Agent
Use for meaningful workspace visual/interaction changes.

Responsibilities:
- implement from `DESIGN_SYSTEM.md`
- preserve information density
- keyboard/focus behavior
- responsive/narrow states
- visual evidence

Checks:
- no AI-SaaS decorative drift
- host UI remains usable
- interactions map to shared commands

### Provider Compatibility Agent
Use for `src/providers/*` work.

Responsibilities:
- re-check current supported/policy boundary when needed
- isolate provider assumptions
- update fixture contract tests
- define degraded behavior
- avoid private APIs/extraction

This role has authority to stop a feature when its required integration path is unsupported or unclear.

### Test Agent
Use for complex behavior matrices, regression reproduction, or independent test review.

Responsibilities:
- test observable behavior
- verify RED where applicable
- detect mock-driven false confidence
- cover failure/migration cases
- maintain fast deterministic tests

Must not alter production semantics merely to make tests easy.

### Debugger
Use when root cause is unknown.

Responsibilities:
- reproduce first
- collect evidence at boundaries
- form/test hypotheses one at a time
- produce root cause + regression test

No random patch sequences.

### Security/Privacy Reviewer
Required for permission, provider, persistence of new data classes, external rendering, filesystem bridge, or auth work.

Responsibilities:
- identify trust boundary change
- validate least privilege
- detect content/secret leakage
- review fail-open behavior
- check policy constraints

### Reviewer
Independent review after implementation where task risk warrants it.

Review priority:
1. requirements
2. correctness
3. architecture
4. tests/failure modes
5. security/privacy
6. maintainability
7. style

### Release Agent
Use for milestone/store/tag release.

Responsibilities:
- run release gates
- verify clean build
- compatibility smoke check
- permission review
- migration path
- release notes/artifacts

## 4. Role routing by task

| Task | Primary | Optional secondary |
|---|---|---|
| small domain feature | Feature Implementer | Reviewer |
| UI feature | Feature Implementer + UI mode | Test/Reviewer |
| provider change | Provider Compatibility | Security + Reviewer |
| storage migration | Feature Implementer | Architecture + Test |
| graph projection | Feature Implementer | Architecture/UI |
| unknown bug | Debugger | Test/Reviewer |
| architectural feature | Planner -> Architecture -> Implementer | Reviewer |
| release | Release | Security/Provider check |

## 5. Parallelization matrix

### Safe to parallelize

- independent research spikes
- visual design exploration vs persistence research when no shared contract changes
- tests for an already frozen interface vs implementation of that exact interface
- documentation/release notes after behavior is frozen

### Usually sequential

- architecture contract -> implementation
- failing regression reproduction -> bug fix
- storage schema -> migration consumers
- provider capability definition -> UI depending on it

### Never concurrently edit without explicit partition

- same reducer/store
- same provider selector/adapter
- same migration chain
- same manifest permissions
- same public interface

## 6. Subagent handoff contract

Every delegated task includes:

```text
Goal:
Exact scope:
Non-scope:
Files/boundary owned:
Interfaces consumed:
Interfaces produced:
Acceptance evidence:
Constraints:
```

A subagent must return:

```text
Changed:
Evidence run:
Findings/risks:
Not verified:
```

The integrator then inspects diff/evidence independently.

## 7. Context discipline

Do not give every agent the whole repository documentation.

Minimum context:
- `AGENTS.md`
- `.agent/README.md`
- task-specific files
- exact design/acceptance criteria
- relevant source/tests

Smaller bounded context improves reliability.

## 8. Review independence

For medium/high-risk changes, the reviewer should not rely solely on the implementer's summary. Inspect the changed behavior/diff and run or inspect fresh verification.

Provider/persistence/security changes benefit most from independent review.

## 9. Conflict resolution

When agents disagree:

1. return to acceptance criteria
2. return to measured evidence/tests
3. return to architecture/security invariants
4. choose the simpler reversible design when both satisfy requirements

Do not resolve technical disagreement by adding both approaches.

## 10. Agent anti-patterns

Avoid:

- "agent swarm" on one tightly coupled feature
- planner producing massive speculative plans
- reviewer bikeshedding style while missing behavior
- test agent rewriting implementation contract without agreement
- security review only at release time
- implementer claiming success without commands/results
- parallel branches that depend on unmerged evolving interfaces

## 11. Agent performance metric

Evaluate agents by:

- accepted outcomes delivered
- defects prevented/caught
- review rework required
- scope discipline
- evidence quality
- lead time

Do not evaluate by number of commits, files changed, or tokens/actions consumed.
