# Chatspace Privacy

Chatspace is local-first. The v1 extension stores only Chatspace-owned workspace data in Chromium extension-local storage (`chrome.storage.local` / `browser.storage.local`).

## Data stored locally

- folder hierarchy and labels
- validated ChatGPT conversation URLs explicitly saved by the user
- user-authored Markdown notes and note-to-chat links
- workspace tabs and local layout state
- user-created graph relationships

## Data Chatspace does not collect

Chatspace v1 does not collect, store, transmit, or reuse:

- ChatGPT cookies, session tokens, authorization headers, or account credentials
- automatically extracted ChatGPT messages or model output
- private/undocumented provider API responses
- browsing history outside the explicitly supported ChatGPT host
- telemetry or analytics

There is no Chatspace cloud backend in v1. Export/import is initiated explicitly by the user and operates on the local workspace JSON.

## Permissions

The extension requests `storage` to persist Chatspace-owned state. The content script is scoped to `https://chatgpt.com/*`. No cookies, history, tabs, webRequest, or broad host permission is required by v1.

## Deletion

Use **Settings → Reset local data** to delete Chatspace-owned workspace data. The reset requires explicit confirmation and does not change ChatGPT data.
