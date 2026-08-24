# Skill: Architecture / New Subsystem

Use when work introduces a new subsystem, changes dependency direction, adds a persistence/trust boundary, or changes interfaces shared by multiple features.

## Procedure

### 1. Frame the problem

State:

```text
User/system problem:
Current limitation:
Required invariants:
Constraints:
Non-goals:
```

### 2. Map current system

Show relevant components, state ownership, data flow, external boundaries, and failure modes. Do not design from generic best practices without inspecting current code.

### 3. Propose 2–3 approaches

Compare:

- complexity
- coupling
- testability
- failure isolation
- reversibility
- delivery sequence
- security/compliance impact

Lead with the smallest approach that satisfies requirements.

### 4. Define boundaries/interfaces

For each unit answer:

- responsibility
- inputs/outputs
- dependencies
- owned state
- failure behavior

If a unit cannot be understood without reading another unit's internals, boundary is likely weak.

### 5. Model data/state

Identify canonical source of truth and derived views.

For persisted data define schema/migration before implementation.

For external provider behavior define capability/degraded states.

### 6. Design failure modes

At minimum consider:

- unavailable dependency/capability
- malformed external input
- partial persistence failure
- lifecycle restart/unmount
- incompatible version/schema

Failures should be contained by boundaries.

### 7. Security/compliance review

If architecture touches provider data, permissions, filesystem, or new external services, read `SECURITY_COMPLIANCE.md` and explicitly include trust boundaries.

### 8. Decompose vertically

Implementation plan should create independently testable increments. Avoid infrastructure-first decomposition that produces no usable behavior until the end.

### 9. Record decision

Add/update `DECISIONS.md` with why this approach wins and what evidence would cause reconsideration.

### 10. Handoff to feature delivery

Implementation starts only after the design/scope is accepted. Then each slice uses `feature-delivery.md` and TDD.

## Architecture smells

- abstraction for hypothetical second provider
- domain importing browser/React/provider implementation
- two canonical stores for same state
- graph renderer becoming database
- content script doing persistence + business logic + rendering in one file
- generic event bus before direct dependencies are painful
- provider integration that fails the entire workspace

## Output

```text
Problem/invariants:
Options considered:
Chosen architecture:
Boundaries/data flow:
Failure model:
Security/compliance:
Vertical slices:
ADR update:
```
