# Chatspace

Chatspace is a local-first Chromium Side Panel companion that lives **beside ChatGPT**. Native ChatGPT remains the conversation runtime; Chatspace helps you save important conversation references, remember why they matter, find them again, resume them, distill local Markdown notes, and keep user-owned knowledge portable.

## Core workflow

```text
Work in native ChatGPT
-> save an important conversation reference
-> optionally add "Why saved"
-> continue later from Home or Ctrl/Cmd K
-> find by local title/context/folder/note content
-> resume the validated native ChatGPT conversation
-> organize or distill into Markdown when useful
-> explicitly export/import/sync user-owned local knowledge
```

Chatspace does not duplicate the ChatGPT conversation UI and does not extract provider conversation content for its core workflow.

## Product model

```text
Browser window
├── Chatspace Side Panel
│   ├── Home: Continue / Inbox / Pinned
│   ├── Explorer: folders / saved chats / notes / archive
│   ├── Ctrl/Cmd K: recent work + local retrieval + commands
│   └── Workbench: notes / advanced views / graph / settings / Markdown Sync
│
└── Native ChatGPT page
    └── messages / composer / tools / provider runtime
```

## Current capabilities

### Core

- save validated URL-only ChatGPT conversation references
- optional user-authored **Why saved** context, editable after capture
- unified Home **Continue** surface across recent saved chats and non-Inbox notes
- Capture Inbox for low-friction local Markdown capture
- deterministic `Ctrl/⌘ K` retrieval across local chat labels/context, folders, notes, and commands
- relevance-first ranking with pin/recency as tie-break signals
- validated resume navigation back to native ChatGPT
- nested folders, pins, archive/restore, multi-select and bulk triage
- Markdown notes with Edit/Preview and tags
- schema-validated local recovery/import/export through `chrome.storage.local`

### Advanced local knowledge

- linked ChatGPT references from notes
- `[[Title]]` note links, backlinks, and deterministic related-local navigation
- lightweight typed properties and AND-only saved views
- spatial Graph projection with search/focus/provenance
- existing legacy manual Graph relationships remain visible/deletable, but default Graph UX no longer authors new ones
- explicit/imported note-template records remain compatible, but new workspaces no longer seed the former built-in Learning Note
- direct user-selected-folder Markdown Sync to `<vault>/Chatspace/`
- explicit portable Markdown/folder export and supported Markdown import preview/round trip

Advanced PKM features are intentionally secondary to the save → find → resume loop.

## Local data contract

`WorkspaceSnapshot` schema **v4** is canonical.

- v4 adds local `ChatReference.annotation` / Why saved
- accepted v1/v2/v3 state migrates deterministically to v4
- v3 saved views, templates, notes, relationships, tabs, and layout are preserved
- older migration does not invent the deprecated Learning Note preset
- corrupted/unsupported state fails closed rather than silently replacing user data

## Provider boundary

Provider presence and navigation are handled through validated ChatGPT URLs and browser tab APIs.

The core workflow does **not** require a ChatGPT content script or provider DOM bridge.

Chatspace does not scrape conversations, crawl history, read provider cookies/session tokens, use private endpoints, intercept provider network traffic, or automatically extract ChatGPT output.

`Why saved` is user-authored Chatspace metadata, not generated from provider messages.

## Portability

Canonical workspace state remains extension-local JSON. Explicit portable export projects user-owned data into human-readable files.

Saved-chat export may include the local label, Why-saved annotation, local metadata, and validated target URL. Native ChatGPT conversation content is never automatically included.

Markdown Sync is manual and one-way and requires no terminal, bearer token, or localhost server. The selected vault directory handle is stored separately in IndexedDB rather than inside workspace JSON.

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

`pnpm build` produces the unpacked Chromium extension under `.output/`. `pnpm zip` produces the install/distribution ZIP under `.output/`.

For Chromium development:

1. run `pnpm dev`
2. load the generated WXT development extension with **Load unpacked**
3. open `chatgpt.com`
4. click the Chatspace extension action; Chatspace opens in the browser Side Panel
5. keep native ChatGPT in the main page and use the Side Panel for local capture/retrieval/navigation

CI uses the committed `pnpm-lock.yaml` with frozen install and repository gates. Real Side Panel/provider-tab/File System behavior is validated separately through bounded live-browser acceptance; jsdom tests are not labeled as browser/E2E evidence.

## Agent/project knowledge

```text
AGENTS.md
DESIGN.md

.agents/
├── PROJECT.md
├── ARCHITECTURE.md
├── CURRENT_ITERATION.md
├── CODE_PATTERNS.md
├── QUALITY.md
└── DECISIONS.md
```

`AGENTS.md` is the thin agent entrypoint. `.agents/` holds canonical project knowledge/state. Root `DESIGN.md` remains the durable product-experience and visual-design authority.

## Release status

Chatspace is a development/daily-driver candidate, not yet a public/store-ready release. Repository build/package confidence is automated; actual Chromium Side Panel interaction and File System Access behavior still require bounded live-browser acceptance where relevant.

## Safety and privacy

Local workspace data is extension-owned. Provider integration remains URL/tab-only. See `PRIVACY.md`, `SECURITY.md`, and `.agents/ARCHITECTURE.md` for the current trust/privacy model.
