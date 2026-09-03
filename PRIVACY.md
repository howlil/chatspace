# Chatspace Privacy

Chatspace is local-first. Canonical workspace data is stored in Chromium extension-local storage (`chrome.storage.local` / `browser.storage.local`).

## Data stored locally

- folder hierarchy and labels
- validated ChatGPT conversation URLs explicitly saved by the user
- local labels and optional user-authored **Why saved** annotations for saved conversation references
- user-authored Markdown notes, tags, local properties, and note-to-chat/note-to-note relationships
- saved local views and compatible explicit template records
- workspace tabs, pins, archive lifecycle, and persisted local layout/theme state
- existing local manual graph relationships
- the user-selected vault directory handle, stored separately in integration-owned IndexedDB rather than in workspace state/export

`Why saved` is written by the user. Chatspace does not derive or populate it by reading ChatGPT messages.

## Local retrieval

Home, Explorer, and `Ctrl/⌘ K` retrieval operate on Chatspace-owned local data such as saved labels, Why-saved annotations, folders, note titles/tags/properties/content, pins, and timestamps.

Provider conversation content is not an implicit search/indexing input.

## Optional local filesystem writes

When the user explicitly connects a local vault and invokes Markdown Sync, Chatspace writes the selected local note beneath `<vault>/Chatspace/` using the browser File System Access API.

Sync is manual and one-way. The selected filesystem handle is not included in `WorkspaceSnapshot` or workspace export/import. Chatspace does not require or expose a localhost vault server.

Explicit portable export may write Chatspace-owned saved-chat metadata, including local labels, Why-saved annotations, and validated target URLs. It does not automatically export native ChatGPT conversation messages/output.

## Data Chatspace does not collect

Chatspace does not collect, store, transmit, or reuse:

- ChatGPT cookies, session tokens, authorization headers, or account credentials
- automatically extracted ChatGPT messages or model output
- private/undocumented provider API responses
- provider browsing/conversation history
- telemetry or analytics

There is no Chatspace cloud backend. Workspace import/export and filesystem operations are explicitly user initiated.

## Provider access

The core workflow uses validated ChatGPT URLs and browser tab navigation. It does not require a ChatGPT content script or provider DOM bridge.

Chatspace does not scrape the ChatGPT DOM, crawl conversations, intercept provider network traffic, or automatically extract provider content.

## Permissions

The current extension manifest requests:

- `storage` for Chatspace-owned workspace persistence
- `sidePanel` for the primary Chatspace UI
- host access scoped to `https://chatgpt.com/*` for the supported provider navigation boundary

Chatspace does not request cookies, history, `webRequest`, `<all_urls>`, or localhost host access for the current product.

## Deletion

Use **Settings → Reset local data** to delete Chatspace-owned canonical workspace data. Reset requires explicit confirmation and does not change ChatGPT data.

Disconnecting the local vault removes Chatspace's stored vault connection handle; it does not delete the user's vault or provider data.
