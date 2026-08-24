# Skill: Research / Feasibility Spike

Use when a technical/product assumption is uncertain and production work depends on it.

## Rule

A spike produces evidence and a decision. Throwaway probe code is not silently promoted to production.

## Procedure

### 1. Write one question

Good:
> Can WXT mount a Shadow DOM React surface on the supported host route without style leakage and duplicate roots across SPA navigation?

Bad:
> Research browser extensions.

### 2. State decision unlocked

What architecture/implementation choice depends on the answer?

### 3. Choose cheapest valid evidence

Priority:

1. official documentation
2. minimal isolated local experiment
3. existing project source/test evidence
4. targeted external examples

For changing libraries/platform rules, verify against current official docs.

### 4. Time/scope bound by stop condition

Stop when evidence can choose among defined alternatives. Do not turn a spike into implementation.

### 5. Compare alternatives

Use:

```text
Option:
Evidence:
Advantages:
Risks:
Reversibility:
Recommendation:
```

### 6. Record result

If architectural, add/update `DECISIONS.md`.

If immediate project state changes, update `STATE.md`.

### 7. Discard or clearly label probe code

Production implementation starts as a separate accepted task using TDD/normal workflow.

## Typical Chatspace spikes

- WXT Shadow DOM/content-script integration
- native IndexedDB vs Dexie migration ergonomics
- graph renderer performance at target scale
- Chrome/Firefox API compatibility
- provider-documented integration capability
- localhost companion packaging/security approach

## Provider research warning

Do not use a spike to reverse engineer private ChatGPT APIs, credentials, protections, or automated output extraction. Unsupported paths are not acceptable merely because a prototype works.

## Output

```text
Question:
Evidence:
Alternatives:
Decision:
Confidence/unknowns:
Follow-up production task:
```
