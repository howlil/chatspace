# Agent Instructions

Use `.agents/PROJECT.md`, `.agents/ARCHITECTURE.md`, `.agents/CURRENT_ITERATION.md`, `.agents/CODE_PATTERNS.md`, `.agents/QUALITY.md`, `.agents/DECISIONS.md`, and `DESIGN.md` as repository authorities. Always inspect `CURRENT_ITERATION.md` when continuing active work.

## Working rule

Understand the requested outcome, make the smallest coherent change at the correct owner, verify actual changed risk, then ship. Avoid planning ceremony, speculative abstractions, unrelated refactors, and expensive tests that do not protect changed behavior.

## Current provider boundary

Chatspace is a conversation-canvas projection inside the ChatGPT main pane. It may:

- validate supported conversation routes;
- inspect the rendered active conversation region and visible provider state;
- use rendered message ids as local graph aliases;
- inject/remove Chatspace-owned canvas/style DOM and `data-chatspace-*` presentation markers;
- copy rendered markup into the Chatspace inspector only through the owned allowlist sanitizer;
- visually hide native turn containers only after a valid projection exists;
- persist structural graph metadata that contains no prompt/response content;
- after explicit user action, focus/reveal the native composer or click a rendered native fork control.

It must not alter provider message text, child order, message identity, links, code blocks, tool output, native control state, or composer content; call private APIs; inspect cookies/auth material; intercept network traffic; automatically submit messages; or invent hidden branch state.

Provider mismatch must fail back to native ChatGPT. No canvas is better than guessed or destructive projection.

## Verification

Use static checks for syntax/type/style risk, focused deterministic tests for graph/DOM/interaction behavior, and extension build/package verification before considering work complete. Live browser inspection is useful for real selector/visual compatibility but is not synthetic CI ceremony by default.

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
