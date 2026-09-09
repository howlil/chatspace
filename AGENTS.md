# Agent Instructions

Use `.agents/PROJECT.md`, `.agents/ARCHITECTURE.md`, `.agents/CURRENT_ITERATION.md`, `.agents/CODE_PATTERNS.md`, `.agents/QUALITY.md`, `.agents/DECISIONS.md`, and `DESIGN.md` as the repository authorities. Always inspect `CURRENT_ITERATION.md` when continuing active work.

## Working rule

Understand the requested outcome, make the smallest coherent change at the correct owner, verify actual changed risk, then ship. Avoid planning ceremony, speculative abstractions, unrelated refactors, and expensive tests that do not protect changed behavior.

## Current provider boundary

Chatspace is a direct ChatGPT main-pane conversation canvas. It may validate supported conversation routes, inspect rendered message structure and rendered message ids, observe DOM changes, project rendered turns into Chatspace-owned cards/edges, persist structural graph metadata, add/remove `data-chatspace-*` presentation attributes, and inject/remove scoped canvas/style nodes.

ChatGPT remains the authority for message generation, native branch actions, composer behavior, tools, auth, and navigation. Chatspace must not rewrite provider message text, child order, controls, message identity, links, code blocks, tool output, cookies/auth material, or composer state, and must not reconstruct hidden provider data that is not rendered in the DOM.

Native provider turns may be visually hidden only after a valid non-empty canvas projection is ready. Provider mismatch, unsupported routes, or disconnect must restore native ChatGPT. No decoration is better than guessed or destructive mutation.

Persisted graph metadata may contain only structural ids/parent/path/route information unless the user explicitly authorizes a different data policy. Do not persist transcript text or rendered HTML by default.

## Verification

Use static checks for syntax/type/style risk, focused deterministic tests for owned graph/DOM behavior, and extension build/package verification before merge. Live browser inspection is useful for real selector/visual compatibility but is not a synthetic CI requirement.

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
