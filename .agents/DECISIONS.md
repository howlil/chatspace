# Decisions

## D-018 — Main-pane response cards are the active product

Chatspace augments rendered assistant responses directly inside the native ChatGPT conversation pane. The previous Side Panel, graph projection, bridge/reconnect runtime, annotation persistence, and their related permissions are superseded for the active product.

Why: the user should get the spatial/card treatment exactly where the response appears instead of switching to a second surface.

Provider rule: mutate presentation only. Chatspace may add its own attributes and scoped styles to already-rendered assistant messages, but must leave the provider message content and controls intact.

Fork/branch rule: a fork or newly rendered conversation is decorated when it appears in the DOM. Visible provider response-variant controls may affect card styling; hidden branch state is not inferred.

Motion rule: use short, interruptible, reduced-motion-safe transitions inspired by Transitions.dev. Do not animate every streaming token.

## D-010 — Deterministic repository verification remains the merge gate

Use lint, strict typecheck, focused deterministic tests, and extension build/CI for merge confidence. Live ChatGPT inspection is useful for selector and visual compatibility but is not a separate synthetic browser-test requirement.
