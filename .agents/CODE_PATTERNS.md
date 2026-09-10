# Code Patterns

## Runtime ownership

Keep ChatGPT-specific DOM integration under `src/providers/chatgpt/`. `entrypoints/chatgpt.content.ts` is lifecycle composition only.

Within the canvas runtime:

```text
dom.ts          -> provider discovery/read + sanitizer
turnIdentity.ts -> provider-id alias rules
graphEngine.ts  -> graph state/reconciliation
layout.ts       -> graph positions only
viewport.ts     -> pan/zoom/coordinate behavior
renderer.ts     -> Chatspace-owned presentation DOM
controller.ts   -> lifecycle + update orchestration
persistence.ts  -> structural storage only
```

## Provider DOM rule

Provider DOM is read-only from Chatspace's perspective. Do not move, wrap, reorder, replace, or rewrite provider messages/controls. A sanitized read-only copy of rendered markup may be projected into Chatspace-owned inspector DOM; use an allowlist, not executable provider elements.

Native turns may receive only Chatspace-owned presentation markers and may be visually hidden after a valid canvas is ready. Cleanup/mismatch must restore them.

## Observation and update path

```text
MutationRecord
-> derive provider alias when possible
-> known alias: update that logical turn only
-> unknown/topology uncertainty: debounced scoped conversation reconciliation
```

Never run layout or full graph rendering for ordinary token changes. Keep Chatspace's own canvas mutations out of provider refresh scheduling.

## Identity

A logical turn may have both `user:<prompt-id>` and `assistant:<response-id>` aliases. Do not make the node identity depend on response text or the prompt->response lifecycle. Text/signature matching is a non-durable fallback only when provider ids are unavailable.

## Rendering

Use keyed patching. Preserve unchanged card elements across topology changes; patch content only when the node changes and update position properties when layout changes. Semantic zoom must not silently change dimensions owned by the layout engine.

## Selectors

Prefer rendered conversation-turn containers as the active sequence boundary, then semantic role markup, then structural fallback. Scope discovery to the active main conversation region. Suspicious/no usable structure means native ChatGPT wins.

## Motion and focus

Use short transitions for causal state changes and respect `prefers-reduced-motion`. Do not animate token arrival. Preserve keyboard focus when updating unrelated topology, use visible `:focus-visible` states, and keep minimap geometry out of the tab sequence.
