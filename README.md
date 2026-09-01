# Chatspace

Chatspace is a local-first workspace that lives **beside ChatGPT**. Native ChatGPT remains the conversation runtime; Chatspace adds a compact Explorer and Workbench for organizing saved conversation references, Markdown notes, tabs, and local graph navigation.

## Product model

```text
Browser window
├── Chatspace Side Panel
│   ├── Explorer: search / pinned / folders / chat refs / notes
│   └── Workbench: tabs / notes / graph / settings / Markdown Sync
│
└── Native ChatGPT page
    └── messages / composer / tools / provider runtime
```

Chatspace does not render a duplicate ChatGPT conversation panel and does not cover the provider page with a fixed workspace overlay.

## Current capabilities

- Chromium Side Panel workspace opened from the extension action
- searchable nested local Explorer
- pinned conversation references
- persisted Explorer collapse/resize and explicit light/dark preference
- workspace tabs
- `Ctrl/⌘ K` keyboard command palette
- explicit URL-only ChatGPT conversation references
- Markdown notes with Edit/Preview, tags, linked chats, and related-local navigation
- spatial graph canvas with containment-aware layout, pan/zoom/fit, search/focus, selection inspector, manual relations, and provenance
- deterministic local related-note suggestions from user-authored local note data
- schema-validated import/export/reset and corrupted-storage recovery
- extension-owned canonical persistence through `chrome.storage.local`
- direct user-selected-folder Markdown Sync to `<vault>/Chatspace/`
- selected vault directory handle stored separately from workspace state in IndexedDB
- retained authenticated localhost Markdown/vault companion as legacy/fallback code, not the primary Side Panel sync path

## Provider boundary

Provider presence and navigation are handled through validated ChatGPT URLs and browser tab APIs.

The core workflow does **not** require a ChatGPT content script or provider DOM bridge.

Chatspace does not scrape conversations, crawl history, read provider cookies/session tokens, use private endpoints, intercept provider network traffic, or extract ChatGPT output.

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

`pnpm build` produces the unpacked Chromium extension under `.output/`. `pnpm zip` runs WXT packaging and produces the install/distribution ZIP under `.output/`.

For Chromium development:

1. run `pnpm dev`
2. load the generated WXT development extension with **Load unpacked**
3. open `chatgpt.com`
4. click the Chatspace extension action; Chatspace opens in the browser Side Panel
5. keep native ChatGPT in the main page and use the Side Panel for workspace navigation

CI uses the committed `pnpm-lock.yaml` with frozen install, then runs lint, strict typecheck, deterministic tests, and WXT ZIP packaging.

## Agent/project knowledge

Repository agent guidance is intentionally small and canonical:

```text
AGENTS.md
└── .agents/
    ├── PROJECT.md
    ├── ARCHITECTURE.md
    ├── CURRENT_ITERATION.md
    ├── CODE_PATTERNS.md
    ├── QUALITY.md
    ├── DECISIONS.md
    ├── DESIGN.md
    ├── SECURITY.md
    └── RELEASE.md
```

`AGENTS.md` is the thin entrypoint; `.agents/` owns durable Chatspace-specific project knowledge and active engineering state.

## Release status

Chatspace is a development/daily-driver candidate, not yet a public/store-ready release. Repository build/package confidence is automated; actual Chromium Side Panel interaction and File System Access behavior still require bounded live-browser acceptance where relevant.

## Safety and privacy

Local workspace data is extension-owned. Provider integration remains URL/tab-only. See `PRIVACY.md`, root `SECURITY.md`, and `.agents/SECURITY.md` for the current trust/privacy model.
