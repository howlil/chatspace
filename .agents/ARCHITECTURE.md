# Architecture

## Runtime topology

```text
Chromium
└── ChatGPT tab
    └── entrypoints/chatgpt.content.ts
        └── turnCards.ts
            ├── validate conversation URL
            ├── find rendered assistant messages
            ├── add/remove Chatspace presentation attributes
            ├── inject one scoped style element
            └── MutationObserver refresh
```

There is no Chatspace Side Panel, background reconnect runtime, graph projection, extension-owned conversation state, or transcript persistence.

## Ownership

```text
entrypoints/chatgpt.content.ts
  content-script lifecycle only

src/providers/chatgpt/adapter.ts
  URL validation

src/providers/chatgpt/conversation/selectors.ts
  provider DOM discovery only

src/providers/chatgpt/conversation/turnCards.ts
  in-place card decoration + motion + cleanup
```

## Data flow

```text
DOM child/attribute mutation
-> debounce
-> validate current /c/... URL
-> locate assistant elements
-> reconcile data-chatspace-* attributes
-> native ChatGPT continues rendering content normally
```

No message text is copied into extension state. The decorator keeps no canonical conversation model.

## Forks and variants

A fork that navigates to another rendered ChatGPT conversation is just another `/c/...` DOM and receives the same decoration automatically. Visible response-variant controls may mark a card as having variants. Hidden or unrendered branch data is never inferred or fetched.

## Motion

Card motion follows the same principles used by Transitions.dev: short causal transitions, compositor-friendly `transform`/`opacity`/`filter`, and `prefers-reduced-motion` fallback. Streaming does not animate every token; only card state changes.

## Failure isolation

If selectors no longer match, Chatspace produces no decoration. It must not hide, replace, reorder, or block native ChatGPT content. Disconnect removes Chatspace attributes and the injected style element.
