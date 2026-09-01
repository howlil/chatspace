# Security

Chatspace has material browser/provider/storage/filesystem trust boundaries, so security knowledge has its own project authority.

## Trust boundaries

1. Chatspace local workspace data after schema/input validation.
2. Browser tab metadata/navigation through the owned provider boundary.
3. Native ChatGPT page/runtime as external provider-owned state.
4. Direct local-vault filesystem access through an explicit user-selected directory handle.
5. Retained localhost companion as a separate loopback/auth/filesystem boundary.

Material changes to these boundaries require explicit approval.

## Provider boundary

The core provider integration is URL/tab-only.

Do not implement under the current approved architecture:

- undocumented/private ChatGPT endpoints;
- provider cookie/session token reading or reuse;
- interception/replay of provider network traffic;
- provider history crawling;
- DOM scraping or automated output extraction;
- CSP/protection/rate-limit bypass;
- hidden telemetry containing provider content.

The core path does not use a ChatGPT content script or provider DOM bridge.

Validate supported origins/target shapes before navigation and fail closed for unsupported targets.

## Extension permissions

Use least privilege. A new manifest permission must map to a concrete approved capability and have its privacy/threat impact understood.

Do not add broad permissions for hypothetical future use.

Changes to provider host permissions, privileged browser APIs, or filesystem trust boundaries require focused review.

## Workspace persistence

Canonical workspace state is extension-owned `chrome.storage.local` behind `WorkspaceRepository`.

Never persist:

- provider cookies/session tokens;
- passwords/auth headers;
- raw provider network payloads;
- hidden provider state.

Persisted-state changes must preserve fail-closed corruption handling and must not silently discard user data.

Browser extension storage is not a secret vault.

## Untrusted rendering

Treat user-authored/imported Markdown as untrusted rendering input.

- no executable raw HTML/script content;
- no `eval`;
- no remote executable scripts;
- no unsanitized `innerHTML` for untrusted content;
- diagnostics must not include sensitive private payloads.

## Direct local-vault filesystem boundary

The primary vault integration uses an explicit directory chosen by the user.

- store the directory handle separately in IndexedDB;
- keep it outside `WorkspaceSnapshot` and workspace export/import;
- write only beneath the selected vault's `Chatspace/` directory;
- treat file/path inputs as untrusted;
- normalize paths/filenames and prevent traversal/out-of-root writes;
- do not execute Markdown content;
- keep connect/reconnect/change/disconnect explicit;
- sync only user-selected Chatspace note data and only on explicit action.

## Retained localhost companion

The retained companion is not part of the primary Side Panel path.

Current boundary:

- loopback only;
- bearer-authenticated;
- narrow note-sync contract;
- authorized vault/root restriction;
- path canonicalization/traversal prevention;
- no arbitrary shell execution;
- no arbitrary filesystem-write API;
- only explicitly synced local note data crosses the boundary.

Any expansion of command/data/filesystem scope is a material security/data-boundary change.

## Supply chain and CSP

Extension dependencies execute in a privileged context.

- keep the committed lockfile reproducible;
- understand runtime/bundle/security impact of new dependencies;
- bundle executable extension code with the package;
- respect MV3 CSP;
- do not use remote executable scripts or dynamic fetched code.

## Diagnostics and telemetry

Never log or remotely collect:

- provider conversation content;
- cookies/tokens;
- private page content;
- raw user storage dumps.

Remote telemetry is not currently an implied product capability. Adding it requires explicit product/privacy approval and a minimal data contract.

## Focused review triggers

Review the affected threat boundary when a change touches:

- manifest permissions;
- provider target/navigation behavior;
- credentials/auth;
- workspace persisted schema/destructive behavior;
- untrusted rendering;
- local-vault path/permission/write contract;
- localhost companion boundary;
- remote telemetry.
