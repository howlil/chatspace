# Code Patterns

## Runtime rule

Keep provider-specific DOM code under `src/providers/chatgpt/`. `entrypoints/chatgpt.content.ts` is composition only.

## DOM mutation rule

Use the smallest presentational mutation:

```text
read provider DOM
-> add/remove data-chatspace-* attributes
-> let scoped CSS style the existing element
```

Do not clone, wrap, move, replace, or rewrite provider message children unless a later explicit product decision requires it.

## Observation

- observe `childList` plus provider attributes needed for card state;
- debounce refresh;
- never react to Chatspace's own attributes;
- avoid token-by-token `characterData` work;
- cleanup observers, attributes, timers, and injected styles on invalidation.

## Selectors

Prefer semantic `data-message-author-role`, then known turn containers, then structural fallback. A selector failure should mean no decoration, not guessed content.

## Motion

Use short transitions on `transform`, `opacity`, and `filter`; include `prefers-reduced-motion`; do not animate layout for every streaming token.
