# Chatspace Privacy

Chatspace is a local-first conversation map. It reads the rendered ChatGPT conversation on the active supported tab to build an ephemeral graph. Native ChatGPT remains the conversation runtime.

## Data flow

```text
ChatGPT rendered DOM
-> isolated-world bridge
-> memory-only ConversationSnapshot
-> graph / outline / search / focus
```

Rendered conversation content is not automatically written to `chrome.storage.local`, logs, exports, telemetry, or a remote service.

## Data stored locally

The active graph may store only explicit user-owned metadata:

- source pin state;
- source annotation text;
- conversation target and stable source key needed to reconnect that metadata.

The legacy workspace runtime has been removed. This cleanup does not reset, migrate, or delete existing extension-local browser storage data; the active graph runtime does not interpret that old data.

## Provider access

The only provider-content boundary is the isolated-world `entrypoints/chatgpt.content.ts` bridge. It may:

- read rendered message role, text, structure, and stable source identity;
- observe DOM mutations with a debounced refresh;
- observe which source message is visible;
- scroll to and temporarily highlight a source after explicit **Go to source**.

If the active supported tab predates the extension load or has lost its receiver, the Side Panel may re-inject the same static bridge bundle with the scoped `scripting` permission. It does not reload the ChatGPT page.

Chatspace does not read or use:

- cookies, session tokens, authorization headers, or credentials;
- private/undocumented provider APIs;
- provider history outside the rendered active conversation;
- network traffic or intercepted responses;
- composer state for automation or message submission;
- provider content mutation, cloning, moving, or rewriting.

## Permissions

The extension requests:

- `storage` for explicit Chatspace-owned metadata;
- `sidePanel` for the map UI;
- `scripting` only to reconnect the same static bridge bundle in the active supported tab;
- host access scoped to `https://chatgpt.com/*`.

Chatspace does not request cookies, history, `webRequest`, `<all_urls>`, or localhost access.

## User control

The conversation map is created automatically when a supported conversation is open. Pins and annotations are persisted only after the user explicitly selects those actions. There is no setting that silently persists the full conversation transcript.

See [SECURITY.md](SECURITY.md) and [.agents/ARCHITECTURE.md](.agents/ARCHITECTURE.md) for the security boundary and failure behavior.
