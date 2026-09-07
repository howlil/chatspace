# Chatspace Security

## Security boundary

Chatspace augments the ChatGPT web UI with an extension-owned conversation map. It does not act as an alternative ChatGPT network client.

Hard constraints:

- no private or undocumented ChatGPT endpoints
- no provider cookie/session/token reuse
- no cookies, auth-token extraction, private API calls, network interception, history crawling, composer automation, or provider-content mutation
- no protection, rate-limit, or access-control bypass
- provider-specific behavior remains behind a narrow capability adapter
- invalid persisted state fails closed and is not overwritten automatically

## Rendered conversation bridge

The only provider-content boundary is the isolated-world content script at `entrypoints/chatgpt.content.ts`. It may read rendered message roles, text/structure, stable DOM/provider identifiers, DOM mutations, and viewport visibility. Its output is normalized into an ephemeral `ConversationSnapshot` held in memory by the Side Panel. The Side Panel may use the narrowly scoped `scripting` permission to re-inject this exact bridge bundle into the active `https://chatgpt.com/*` tab when a receiver is missing; it does not reload the page or execute arbitrary provider code.

The bridge may scroll to and temporarily highlight a source element only after an explicit **Go to source** action. It must not clone, rewrite, remove, move, or submit provider content. Raw conversation text is not persisted, logged, exported, or sent to a remote service. Persistent conversation metadata is limited to explicit pins and annotations keyed by validated target and source key.

## Local data recovery

Workspace payloads are schema-versioned and validated before use. If extension-local data fails validation, normal persistence is blocked, the raw payload remains available from the recovery UI, and the user can download it before importing a valid backup or resetting local data.

## Reporting a vulnerability

Please open a private GitHub security advisory for vulnerabilities when repository security advisories are available. Do not include real provider credentials, session cookies, or private conversation content in reports.
