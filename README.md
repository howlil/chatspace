# Chatspace

Chatspace is a local-first Chromium Side Panel companion that lives **beside ChatGPT**. Native ChatGPT remains the conversation runtime; Chatspace helps you save important conversation references, remember why they matter, find them again, resume them, distill local Markdown notes, and keep user-owned knowledge portable.

## Core workflow

```text
Work in native ChatGPT
-> open Chatspace beside the current conversation
-> see whether that conversation is already saved
-> save the validated reference + optional "Why saved"
-> continue later from Home or Ctrl/Cmd K
-> find by local title/context/folder/note content
-> resume the validated native ChatGPT conversation
-> organize or distill from Library when useful
-> manage portability/integrations explicitly from Settings
```

Chatspace does not duplicate the ChatGPT conversation UI and does not extract provider conversation content for its core workflow.

## Product model

```text
Browser window
├── Chatspace Side Panel
│   ├── Home
│   │   ├── Current conversation
│   │   ├── Continue
│   │   ├── Inbox
│   │   └── Pinned
│   ├── Library: folders / saved chats / notes / archive
│   ├── Ctrl/Cmd K: grouped local retrieval + actions
│   ├── Settings: local data / import-export / Markdown vault
│   └── More: advanced Graph access
│
└── Native ChatGPT page
    └── messages / composer / tools / provider runtime
```

Properties, backlinks, related notes, saved views, Graph, and vault tooling remain available without defining the primary navigation hierarchy.

## Current capabilities

### Core

- contextual current-conversation saved/unsaved state on Home
- save validated URL-only ChatGPT conversation references directly from that context
- safe browser-tab-title prefill for the editable local conversation name when available
- optional user-authored **Why saved** context, editable after capture
- unified Home **Continue** surface across recent unpinned saved chats and non-Inbox notes
- distinct **Pinned** stable shortcuts without duplicating them in Continue
- Capture Inbox for low-friction local Markdown capture; empty Inbox does not occupy a prominent Home section
- deterministic `Ctrl/⌘ K` retrieval across local chat labels/context, folders, notes, saved views, and actions
- empty Quick Open groups Continue / Pinned / Library / Actions; saved views appear only when explicitly searched
- relevance-first ranking with pin/recency as tie-break signals
- validated resume navigation back to native ChatGPT
- matching open ChatGPT conversation tabs are focused/reused before navigating or opening another tab
- Library browsing for nested folders, pins, archive/restore, multi-select and bulk triage
- Markdown notes with Edit/Preview and tags
- schema-validated local recovery/import/export through `chrome.storage.local`

### Advanced local knowledge

- linked ChatGPT references from notes
- `[[Title]]` note links, backlinks, and deterministic related-local navigation
- lightweight typed properties and AND-only saved views
- spatial Graph projection with search/focus/provenance, reached through advanced More access
- existing legacy manual Graph relationships remain visible/deletable, but default Graph UX no longer authors new ones
- explicit/imported note-template records remain compatible, but new workspaces no longer seed the former built-in Learning Note
- direct user-selected-folder Markdown Sync to `<vault>/Chatspace/`, entered from Settings
- explicit portable Markdown/folder export and supported Markdown import preview/round trip

Advanced PKM features are intentionally secondary to the save → find → resume loop.

## Local data contract

`WorkspaceSnapshot` schema **v4** is canonical.

- v4 adds local `ChatReference.annotation` / Why saved
- accepted v1/v2/v3 state migrates deterministically to v4
- v3 saved views, templates, notes, relationships, tabs, and layout are preserved
- older migration does not invent the deprecated Learning Note preset
- corrupted/unsupported state fails closed rather than silently replacing user data
- M18 navigation changes do not change the persisted workspace schema

## Provider boundary

Provider presence and navigation are handled through validated ChatGPT URLs and browser tab APIs.

The Side Panel may use ordinary browser-tab metadata such as URL/title/window identity to show current context, prefill an editable local label, and focus an already-open matching conversation. This does not read ChatGPT messages or page DOM.

The core workflow does **not** require a ChatGPT content script or provider DOM bridge.

Chatspace does not scrape conversations, crawl history, read provider cookies/session tokens, use private endpoints, intercept provider network traffic, or automatically extract ChatGPT output.

`Why saved` is user-authored Chatspace metadata, not generated from provider messages.

## Portability

Canonical workspace state remains extension-local JSON. Explicit portable export projects user-owned data into human-readable files.

Saved-chat export may include the local label, Why-saved annotation, local metadata, and validated target URL. Native ChatGPT conversation content is never automatically included.

Markdown Sync is manual and one-way and requires no terminal, bearer token, or localhost server. The selected vault directory handle is stored separately in IndexedDB rather than inside workspace JSON. Import, export, recovery, and vault controls live under Settings rather than daily navigation.

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

CI uses the committed `pnpm-lock.yaml` with frozen install, lint, strict typecheck, deterministic tests, and extension packaging. Repository-owned deterministic verification is the completion gate; a separate black-box/live-browser test layer is not required.

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

Chatspace is a development/daily-driver candidate, not yet a public/store-ready release. Repository build, deterministic behavior, and package confidence are automated through CI; store readiness remains a separate release/distribution concern.

## Safety and privacy

Local workspace data is extension-owned. Provider integration remains URL/tab-only. See `PRIVACY.md`, `SECURITY.md`, and `.agents/ARCHITECTURE.md` for the current trust/privacy model.
