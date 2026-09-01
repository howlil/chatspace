# Chatspace Privacy

Chatspace is local-first. Canonical workspace data is stored in Chromium extension-local storage (`chrome.storage.local` / `browser.storage.local`).

## Data stored locally

- folder hierarchy and labels
- validated ChatGPT conversation URLs explicitly saved by the user
- user-authored Markdown notes and note-to-chat links
- workspace tabs, pins, and persisted local layout/theme state
- user-created graph relationships
- the user-selected vault directory handle, stored separately in integration-owned IndexedDB rather than in workspace state/export

## Optional local filesystem writes

When the user explicitly connects a local vault and invokes Markdown Sync, Chatspace writes the selected local note beneath `<vault>/Chatspace/` using the browser File System Access API.

Sync is manual and one-way. The selected filesystem handle is not included in `WorkspaceSnapshot` or workspace export/import.

The retained localhost companion is legacy/fallback code and is not required by the primary Side Panel Markdown Sync path.

## Data Chatspace does not collect

Chatspace does not collect, store, transmit, or reuse:

- ChatGPT cookies, session tokens, authorization headers, or account credentials
- automatically extracted ChatGPT messages or model output
- private/undocumented provider API responses
- provider browsing/conversation history
- telemetry or analytics

There is no Chatspace cloud backend. Workspace export/import is initiated explicitly by the user and operates on local Chatspace workspace JSON.

## Provider access

The core workflow uses validated ChatGPT URLs and browser tab navigation. It does not require a ChatGPT content script or provider DOM bridge.

Chatspace does not scrape the ChatGPT DOM, crawl conversations, intercept provider network traffic, or automatically extract provider content.

## Permissions

The current extension manifest requests:

- `storage` for Chatspace-owned workspace persistence
- `sidePanel` for the primary Chatspace UI
- host access scoped to `https://chatgpt.com/*` for the supported provider navigation boundary
- optional host access to `http://127.0.0.1:27123/*` for the retained localhost companion when explicitly used

Chatspace does not request cookies, history, `webRequest`, or `<all_urls>` access for the current product.

## Deletion

Use **Settings → Reset local data** to delete Chatspace-owned canonical workspace data. Reset requires explicit confirmation and does not change ChatGPT data.

Disconnecting the local vault removes Chatspace's stored vault connection handle; it does not delete the user's vault or provider data.
