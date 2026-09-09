# Project

## Product purpose

Chatspace is a Chromium extension that turns a rendered ChatGPT conversation into a zoomable conversation canvas for exploring, continuing, and forking reasoning paths.

```text
ChatGPT rendered conversation
-> provider DOM adapter
-> indexed conversation graph
-> compact canvas cards + branches
```

ChatGPT still owns message generation, composer behavior, native branching, tools, auth, and navigation. Chatspace owns the visual graph projection and its local structural metadata.

## Core user journey

```text
Open a ChatGPT conversation
-> content script reads rendered user/assistant turns
-> provider message ids become stable graph identity when available
-> prompt + response render as one compact node
-> new turns extend the active path
-> native forks reuse the shared prefix and create sibling branches
-> select a node to inspect full rendered content
-> pan/zoom/search/minimap to navigate the graph
-> continue the active leaf or delegate a historical fork to ChatGPT
```

## Active capability

- run only on validated `https://chatgpt.com/c/...` conversations;
- keep ChatGPT DOM as the live content source of truth;
- prefer rendered `data-message-id` values for stable turn identity, with rendered-text fallback when provider identity is absent;
- maintain O(1) node/children indexes and per-conversation active paths;
- separate content changes from topology changes so streaming updates replace only changed cards;
- use a deterministic linear-time layered layout for the single-parent conversation graph;
- provide pan, trackpad navigation, modifier zoom, fit, center, search, minimap, inspector, and active-path emphasis;
- persist structural graph metadata only (ids, parent relationships, paths, conversation targets), not transcript text or rendered HTML;
- fail back to native ChatGPT when a supported conversation cannot be projected safely.

## Explicit non-goals

- private ChatGPT APIs, cookies, auth/session material, network interception, or history crawling;
- inventing hidden/unrendered branch data;
- automatic message submission or rewriting provider composer state;
- durable transcript/content persistence;
- arbitrary free-form node editing or a general-purpose whiteboard.

## Provider mutation boundary

Chatspace may hide rendered provider turn containers only after a valid canvas projection exists, and must restore them on cleanup or provider mismatch. It may inject Chatspace-owned canvas/style nodes and `data-chatspace-*` attributes. It must not rewrite provider message text, child order, message identity, links, code blocks, tool output, controls, or composer state. Native fork/continue behavior is delegated back to ChatGPT.
