# Skill Router

Read only the playbook required by the current task.

| Situation | Skill |
|---|---|
| new subsystem / shared boundary | `architecture.md` |
| normal feature / behavior change | `feature-delivery.md` |
| bug / failing test / unexpected behavior | `debugging.md` |
| workspace UI / graph interaction | `ui-design.md` |
| ChatGPT/provider-facing capability | `chatgpt-compatibility.md` |
| behavior-preserving structural cleanup | `refactor.md` |
| feasibility / technology investigation | `research.md` |
| independent pre-merge review | `review.md` |
| tag/store/milestone release | `release.md` |

## Routing rule

A task may transition between skills, but only for a reason:

```text
unknown feasibility -> research
new boundary         -> architecture
accepted slice       -> feature-delivery
unexpected defect    -> debugging
implementation done  -> review
milestone ready      -> release
```

For UI/provider tasks combine the specialized skill with `feature-delivery.md`; the specialized skill adds constraints, it does not replace TDD/evidence rules.

## Escalation

If a bounded feature reveals a new subsystem, persistence model, permission/trust boundary, or unsupported provider dependency, stop feature implementation and route back to `architecture.md` or `research.md`.

Do not continue by silently inventing abstractions.
