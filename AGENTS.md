# Agent Instructions

Use `.agents/PROJECT.md`, `.agents/ARCHITECTURE.md`, `.agents/CURRENT_ITERATION.md`, `.agents/CODE_PATTERNS.md`, `.agents/QUALITY.md`, `.agents/DECISIONS.md`, and `DESIGN.md` as the repository authorities. Always inspect `CURRENT_ITERATION.md` when continuing active work.

## Working rule

Understand the requested outcome, make the smallest coherent change at the correct owner, verify actual changed risk, then ship. Avoid planning ceremony, speculative abstractions, unrelated refactors, and expensive tests that do not protect changed behavior.

## Current provider boundary

Chatspace is a direct ChatGPT main-pane decorator. It may validate supported conversation routes, inspect rendered message structure, observe rendered DOM changes, add/remove `data-chatspace-*` presentation attributes, and inject/remove one scoped style element.

It must not alter provider message text, child order, controls, message identity, links, code blocks, tool output, or composer state. It also must not reconstruct provider data that is not rendered in the DOM.

Provider mismatch must fail closed to native ChatGPT: no decoration is better than guessed or destructive mutation.

## Verification

Use static checks for syntax/type/style risk, focused deterministic tests for owned DOM-decoration behavior, and extension build/package verification before merge. Live browser inspection is useful for real selector/visual compatibility but is not a synthetic CI requirement.

## Authority order

```text
explicit current user instruction
-> .agents/PROJECT.md / approved material decisions
-> .agents/ARCHITECTURE.md / DESIGN.md
-> .agents/CURRENT_ITERATION.md
-> .agents/CODE_PATTERNS.md / .agents/QUALITY.md
-> current code/tests
-> historical superseded decisions
```
