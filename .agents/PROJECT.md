# Project

## Product purpose

Chatspace is a Chromium extension that improves readability inside the native ChatGPT conversation pane.

```text
ChatGPT rendered conversation
-> Chatspace DOM decorator
-> assistant responses become cards
```

ChatGPT still owns the conversation runtime, message content, composer, tools, branching behavior, and navigation. Chatspace owns only its presentational decoration.

## Core user journey

```text
Open a ChatGPT conversation
-> content script detects rendered assistant messages
-> each response is decorated in place as a card
-> streaming content grows inside the same native message
-> a newly rendered response or forked conversation is decorated automatically
```

## Active capability

- run only on validated `https://chatgpt.com/c/...` conversations;
- find rendered messages through semantic/provider DOM selectors with structural fallbacks;
- decorate assistant messages in place without cloning, moving, or rewriting their content;
- observe new responses and streaming-state attributes with a debounced `MutationObserver`;
- identify visible provider response-variant controls only when they exist in the rendered DOM;
- apply short card reveal/hover/streaming transitions with reduced-motion support;
- remove Chatspace decoration cleanly when the content script is invalidated or the page is unsupported.

## Explicit non-goals

- Side Panel UI;
- conversation graph/outline/search/focus;
- transcript persistence, pins, annotations, notes, or workspace storage;
- private ChatGPT APIs, cookies, auth/session material, network interception, or history crawling;
- composer manipulation or automatic message submission;
- reconstructing hidden/unrendered branch data.

## Provider mutation boundary

Allowed mutations are presentational only: a single Chatspace-owned `<style>` node plus `data-chatspace-*` attributes on already-rendered assistant message elements. Chatspace must not alter provider text, child order, controls, message identity, links, code blocks, tool output, or composer state.
