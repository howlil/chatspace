# Current Iteration

Status: **IN_PROGRESS**

## M24 — Production Canvas Core

**Outcome:** make the conversation canvas stable, accessible, incremental, and release-trustworthy without changing ChatGPT's execution authority.

In scope:

- prompt/response provider ids are aliases for one logical turn;
- keyed topology rendering preserves existing card DOM and visual focus;
- semantic zoom never changes graph geometry behind the layout engine;
- topology changes preserve the selected/current node's screen anchor;
- provider mutations update one known turn when safe and fall back to a scoped conversation scan only when topology is uncertain;
- conversation discovery is scoped to the active conversation region and fails back to native ChatGPT on suspicious structure;
- canvas keyboard navigation and inspector focus lifecycle;
- persistence keys are isolated per graph family/target to avoid cross-tab cache clobber;
- release docs match actual storage/composer/canvas behavior;
- unused React/Tailwind runtime baggage is removed if no source consumer exists.

## Verification

- lint;
- strict typecheck;
- deterministic regression tests for changed risks;
- extension build/package;
- final CI verify on `master`.
