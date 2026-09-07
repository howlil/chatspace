# Chatspace

Chatspace is a local-first Chromium Side Panel for navigating long ChatGPT conversations as a spatial text graph. ChatGPT remains the conversation runtime; Chatspace reads the rendered conversation read-only and owns only the navigation projection.

## Core workflow

```text
Open a long ChatGPT conversation
-> open Chatspace beside it
-> read the rendered DOM into an ephemeral snapshot
-> inspect the turn graph or outline
-> search, focus, collapse, or select a turn
-> Go to source to reveal the exact native message
-> optionally pin or annotate a source
```

The primary product surface is the conversation map. There is no Home, Library, workspace tree, generic PKM dashboard, or legacy workspace Graph in the active Side Panel route.

## Runtime model

```text
ChatGPT rendered DOM
        |
        v
isolated read-only DOM adapter
        |
        v
ephemeral ConversationSnapshot
        |
        v
Conversation Graph / Outline / Search / Focus
        |
        v
explicit Go to source -> native ChatGPT message
```

The graph is turn-first, deterministic, and text-based. It uses stable provider/DOM/fingerprint source anchors. A plain DOM sequence creates structural `next` relationships; it never invents provider branching.

## Current capabilities

- automatic conversation detection on supported `https://chatgpt.com/c/...` tabs;
- automatic bridge reconnect for already-open tabs, without a disruptive page reload;
- debounced live DOM observation during streaming;
- compact turn graph with pan, zoom, selection, focus neighborhood, collapse, and synchronized outline;
- local full-text search across rendered prompt/response text;
- source navigation with smooth scroll and temporary non-destructive highlight;
- source-visible feedback from native ChatGPT back to the matching graph node;
- explicit streaming, loading, and DOM-unsupported states;
- explicit pins/annotations persisted by conversation target + source key only.

## Privacy and trust boundary

The only provider-content boundary is `entrypoints/chatgpt.content.ts` in the isolated world. It may read rendered message role/text/structure, observe DOM mutations and viewport visibility, identify source elements, and scroll/highlight after an explicit user action.

The Side Panel may use the narrowly scoped `scripting` permission to re-inject the same static bridge bundle into the active supported ChatGPT tab when its receiver is missing. It does not reload the page, execute arbitrary provider code, access cookies/tokens/private APIs, intercept network requests, manipulate the composer, send messages, or modify provider content.

Conversation text stays in memory and is not automatically written to extension storage, logs, exports, or telemetry. Only explicit user-owned pins and annotations are persisted.

The legacy workspace runtime and compatibility codecs are no longer part of the active repository surface. This cleanup does not reset, migrate, or delete any existing browser storage data.

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md), and [.agents/ARCHITECTURE.md](.agents/ARCHITECTURE.md) for the detailed boundary.

## Development

Requirements: Node 22.12+ and pnpm 11.23.0.

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm verify
pnpm build
pnpm zip
```

`pnpm build` produces the unpacked Chromium extension under `.output/chrome-mv3/`. Load that directory with **Load unpacked** in `chrome://extensions`.

For local runtime testing:

1. build the extension;
2. load or reload `.output/chrome-mv3/` in Chromium;
3. open a supported ChatGPT conversation;
4. open Chatspace in the Side Panel;
5. stream a new response and confirm the map updates without reloading ChatGPT.

The repository gate is lint, strict TypeScript, deterministic tests, and extension packaging. Live ChatGPT runtime checks remain useful manual evidence but are not synthetic E2E requirements.

## Project knowledge

```text
AGENTS.md
DESIGN.md
PRIVACY.md
SECURITY.md
.agents/PROJECT.md
.agents/ARCHITECTURE.md
.agents/CURRENT_ITERATION.md
.agents/CODE_PATTERNS.md
.agents/QUALITY.md
.agents/DECISIONS.md
```

## Status

The graph-only M21 implementation is local and verification-ready. It has not been committed, pushed, merged, deployed, or validated against a live 50+ message ChatGPT conversation in this session.
