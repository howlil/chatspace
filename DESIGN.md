# Design

Chatspace augments native ChatGPT rather than creating a second workspace.

## Primary surface

The assistant response itself is the component. Keep native text, code blocks, citations, tool output, and controls intact; Chatspace supplies only the card surface around the rendered response.

## Card language

- restrained border and depth;
- medium radius, not oversized pill geometry;
- compact padding that still gives long answers breathing room;
- neutral surface that works with ChatGPT light/dark themes;
- one desaturated steel-blue accent only for streaming/visible variant state;
- no gradients, glow, decorative badges, or extra permanent toolbar chrome.

## Motion

Use Transitions.dev as the motion-quality reference, not as a runtime dependency.

- new response: short rise + fade + very small blur resolve;
- hover: at most a one-pixel lift with subtle shadow change;
- streaming: stable card with restrained border emphasis, not token-by-token animation;
- fork/newly rendered response: same entry transition as any other response;
- all motion must be disabled by `prefers-reduced-motion`.

Motion exists to show cause/effect and preserve continuity. It must not delay reading or change message meaning.

## Provider safety

Design must never require moving, cloning, rewriting, hiding, or replacing native ChatGPT content. If Chatspace styling fails, the underlying conversation remains usable.
