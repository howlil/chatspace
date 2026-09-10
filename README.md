# Chatspace

Chatspace is a Chromium extension that turns a rendered ChatGPT conversation into a zoomable, branch-aware canvas inside the ChatGPT main pane.

## Behavior

```text
ChatGPT rendered conversation
-> scoped provider DOM adapter
-> logical turn graph
-> compact canvas cards + branches
```

A canvas node represents one user prompt plus its assistant response. Chatspace prefers rendered ChatGPT message ids for stable identity, keeps prompt/response ids as aliases for the same logical turn, updates streaming content in place, and reuses shared prefixes when a native fork becomes visible.

The canvas supports pan, modifier-wheel zoom, Fit/Center, search, keyboard node navigation, a minimap, a full-content inspector, and native Continue/Fork delegation. ChatGPT remains responsible for generation, composer behavior, tools, branching, authentication, and navigation.

## Local data

Chatspace stores only structural graph metadata needed to preserve known branch shape across reloads: local node ids, provider message-id aliases, parent relationships, and conversation-path references. Prompt text, response text, rendered HTML, cookies, credentials, and auth/session material are not persisted.

## Safety boundary

Chatspace never calls private ChatGPT APIs or automatically submits messages. Native ChatGPT turns are visually hidden only after a valid canvas projection exists and are restored if projection fails or the content script disconnects.

## Development

```bash
pnpm install
pnpm dev
pnpm verify
pnpm build
```

Load the unpacked Chromium extension from `.output/chrome-mv3/` after building.
