# Chatspace

Chatspace is a local-first workspace that lives **beside ChatGPT**. Native ChatGPT remains the conversation runtime; Chatspace adds a compact Explorer and Workbench for organizing saved conversation references, Markdown notes, tabs, and local graph navigation.

## Product model

```text
Browser window
├── Chatspace Side Panel
│   ├── Explorer: search / pinned / folders / chat refs / notes
│   └── Workbench: tabs / notes / graph / settings
│
└── Native ChatGPT page
    └── messages / composer / tools / provider runtime
```

Chatspace does not render a duplicate ChatGPT conversation panel and does not cover the provider page with a fixed workspace overlay.

## Current capabilities

- Chromium Side Panel workspace opened from the extension action
- searchable nested local Explorer
- pinned conversation references
- persisted Explorer collapse/resize
- workspace tabs
- `Ctrl/⌘ K` keyboard command palette
- explicit URL-only ChatGPT conversation references
- Markdown notes with Edit/Preview, tags, and linked chats
- spatial graph canvas with visible edges, zoom, selection inspector, and provenance
- deterministic local related-note suggestions from user-authored local note data
- schema-validated import/export/reset and corrupted-storage recovery
- extension-owned persistence through `chrome.storage.local`
- optional authenticated localhost Markdown/vault bridge

## Provider boundary

The ChatGPT content script is deliberately tiny. It only supports:

- reporting the current page URL
- validating and navigating to an explicit supported `https://chatgpt.com/c/<id>` target

It does **not** scrape conversations, crawl history, read provider cookies/session tokens, use private endpoints, or extract ChatGPT output.

## Development

Requirements: Node 22.12+ and npm 12.0.2.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

For Chromium development:

1. run `npm run dev`
2. load the generated WXT development extension with **Load unpacked**
3. open `chatgpt.com`
4. click the Chatspace extension action; Chatspace opens in the browser Side Panel
5. keep native ChatGPT in the main page and use the side panel for workspace navigation

CI treats lint, strict typecheck, tests, and production build as separate gates.

## Release status

The repository can be a development/daily-driver candidate after product-convergence verification. It should not be called public-store-ready yet: a committed transitive `package-lock.json` and distribution packaging/lifecycle checks are still required.

## Safety and privacy

Local workspace data is extension-owned. Provider integration remains URL-only. See `PRIVACY.md` and `SECURITY.md` for the trust boundary and recovery model.
