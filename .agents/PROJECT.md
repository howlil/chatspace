# Project

## Product purpose

Chatspace is a Chromium extension that turns a rendered ChatGPT conversation into a zoomable conversation canvas for exploring, continuing, and forking reasoning paths.

```text
ChatGPT rendered conversation
-> scoped provider DOM adapter
-> indexed logical-turn graph
-> stable compact canvas projection
```

ChatGPT owns generation, composer content/submission, tools, authentication, navigation, and native branching. Chatspace owns the visual graph projection and local structural metadata.

## Core user journey

```text
Open a ChatGPT conversation
-> read rendered turns inside the active main region
-> prompt/response ids alias to one logical node
-> prompt + response render as a compact card
-> streaming patches the same card in place
-> new turns extend the active path without recreating unaffected cards
-> native forks reuse the shared prefix and create sibling branches
-> select a node to inspect full sanitized rendered content
-> pan/zoom/search/keyboard/minimap to navigate
-> continue current leaf or delegate historical fork to ChatGPT
```

## Active capability

- run only on validated `https://chatgpt.com/c/...` conversations;
- keep ChatGPT rendered DOM as the live content source of truth;
- scope conversation discovery to the active main conversation region;
- model prompt and response provider ids as aliases for one logical turn;
- maintain O(1) node/children/provider-alias indexes and per-conversation paths;
- update known message mutations through a one-node fast path, with scoped full reconciliation for topology/uncertain changes;
- preserve existing keyed card DOM during topology growth;
- preserve selected/current screen position when layout changes where possible;
- use a deterministic linear-time layered layout for the single-parent conversation graph;
- keep semantic zoom geometry constant while reducing visual detail;
- provide pan, modifier zoom, fit, center, search, minimap, inspector, roving keyboard navigation, and active-path emphasis;
- persist structural graph metadata under independent per-family/per-target keys, never transcript content;
- sanitize projected inspector markup with an allowlist;
- fail back to native ChatGPT when projection cannot be trusted.

## Explicit non-goals

- private ChatGPT APIs, cookies, credentials, auth/session material, network interception, or history crawling;
- inventing hidden/unrendered branch data;
- automatic message submission or rewriting native composer content;
- durable transcript/content persistence;
- arbitrary free-form node editing or a general-purpose whiteboard;
- a general graph layout dependency while the product graph remains a single-parent branching sequence.

## Provider mutation boundary

Chatspace may inject its own canvas/style DOM, read rendered provider content, and hide rendered provider turn containers only after a valid projection exists. It may focus the native composer or trigger a rendered native fork control only after explicit user action. It must not rewrite provider message text, child order, message identity, links, code blocks, tool output, native controls, or composer content.
