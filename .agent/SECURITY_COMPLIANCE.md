# Security, Privacy & Compliance

`AGENTS.md` owns workflow and approval boundaries. This file documents current Chatspace security/privacy constraints.

## 1. Principle

Chatspace runs as a browser extension beside an authenticated provider page and has privileged browser capabilities. Treat provider navigation, extension storage, permissions, and the optional localhost bridge as explicit trust boundaries.

Security/privacy constraints shape architecture; they are not release-time checkboxes.

Material changes to permission, trust, privacy, provider, or credential boundaries require explicit user approval.

## 2. Current provider usage boundary

Chatspace's core provider integration is URL-only through validated browser-tab reads/navigation.

It does not need provider content, DOM, session credentials, private endpoints, or programmatic output extraction for the approved core workflow.

Do not implement:

- undocumented/private ChatGPT HTTP/GraphQL/WebSocket endpoints
- interception/replay of private provider network traffic
- cookie/session token reading or reuse
- credential harvesting
- bypass of CSP, anti-automation, rate limiting, or protective measures
- background crawling of conversation history
- automated extraction/scraping of ChatGPT data/output
- reverse engineering of private model/system internals
- hidden telemetry containing provider content

Before implementing a materially new provider-facing capability, re-check the current applicable provider terms/documentation because policies can change.

## 3. Supported-source hierarchy

Prefer sources in this order:

1. Chatspace-owned local state
2. explicit user-created metadata
3. provider-documented browser/platform behavior
4. official user export/import pathways
5. official API/SDK/integration with appropriate credentials and terms
6. provider UI coexistence/navigation that does not require private provider data

Anything outside these categories requires explicit product/security review before implementation.

## 4. Extension permissions

Follow least privilege.

Every new manifest permission must have:

- a concrete approved capability requiring it
- threat/privacy impact understood
- consideration of whether a narrower/optional permission can satisfy the need
- removal condition if the capability is later removed

Avoid broad permissions such as `<all_urls>` when a specific capability/origin permission is sufficient.

Do not add permissions because they may be useful later.

## 5. Browser-tab trust boundary

Active-tab URL metadata is external input.

- validate supported origin and target shape
- normalize targets before navigation
- fail closed on unsupported URLs
- provider unavailability must degrade provider-dependent navigation only
- do not infer or extract conversation content from page internals

The core path does not use a ChatGPT content script or DOM bridge. Do not reintroduce one without an approved requirement and material boundary review.

## 6. Local persistence

Canonical workspace data is extension-owned `chrome.storage.local` behind `WorkspaceRepository`.

Store only Chatspace-owned data required by approved features.

Never store:

- cookies
- provider session tokens
- auth headers
- passwords
- full provider network payloads
- hidden provider state

For user-created notes/chat references:

- storage behavior should remain understandable
- deletion/reset is explicit
- export/recovery paths remain available where approved
- corrupted/unsupported state fails closed
- schema changes must not silently discard user data
- rapid persistence writes remain serialized/coalesced according to current architecture

Browser storage is not a secret vault.

## 7. Rendering and local content

Treat user-authored/imported content as untrusted input for rendering.

- no raw executable HTML from Markdown
- no `eval`
- no remote executable scripts
- no unsanitized `innerHTML` for untrusted content
- keep diagnostic/error surfaces free of sensitive payloads

## 8. Optional localhost vault bridge

The companion is already an implemented optional integration and is **not** part of the core provider/navigation path.

Current security requirements:

- bind loopback only
- bearer-authenticated explicit connection
- narrow note-only contract
- explicit authorized vault/root path
- canonicalize/restrict paths and deny traversal
- no arbitrary shell execution
- no arbitrary filesystem-write API
- request/body limits where appropriate
- only explicitly synced local note data crosses the boundary
- failure degrades vault sync only

Any expansion beyond this contract is a material trust/data boundary change and requires approval.

## 9. Markdown/filesystem safety

For vault writes:

- treat filenames/path inputs as untrusted
- normalize/canonicalize paths
- keep writes inside the authorized root
- avoid unsafe overwrite behavior
- never execute Markdown content
- preserve recovery/migration safety when the persisted/file contract changes

## 10. Supply chain

Dependencies execute in a privileged extension context.

- minimize dependency count
- maintain a committed reproducible lockfile before public distribution
- review runtime/permission/security implications of new dependencies
- use automated dependency/security scanning when it provides meaningful signal
- prefer small platform code over a dependency when correctness/maintenance cost is lower

Convenience alone is not sufficient justification.

## 11. CSP

Respect MV3 CSP constraints.

No:

- `eval`
- remote executable scripts
- dynamic executable code fetched from provider pages

Bundle executable extension code with the extension package.

## 12. Logging and instrumentation

Diagnostics must redact by default.

Never log:

- provider conversation content
- cookies/tokens
- raw private page content
- raw extension-storage dumps

Remote product telemetry is not mandatory. If instrumentation becomes necessary to evaluate an approved product outcome, define the minimum event/data needed and review privacy before implementation. Do not collect provider content.

## 13. Data deletion

`Reset Chatspace` removes Chatspace-owned local data only.

It must not delete or mutate provider conversations/data. Provider data deletion remains a provider action.

## 14. Threat scenarios

### Malicious/unsupported provider target
Mitigation: origin/target validation and fail-closed navigation.

### XSS in local notes/imported Markdown
Mitigation: safe React/Markdown rendering; no raw executable HTML.

### Over-broad extension permission
Mitigation: explicit capability justification + least privilege + approval for material permission boundary changes.

### Corrupted extension storage
Mitigation: schema validation, recovery path, no silent overwrite/reset.

### Dependency compromise
Mitigation: dependency minimization, reproducible lockfile, review/scanning appropriate to distribution risk.

### Localhost bridge path abuse
Mitigation: loopback binding, bearer auth, authorized root, path canonicalization, narrow commands.

## 15. Security review triggers

A focused security/privacy review is required when a change touches:

- manifest permissions
- provider target/navigation contract
- credentials/auth
- storage schema or destructive data behavior
- rendering of untrusted content
- localhost bridge command/data/path contract
- remote telemetry

Review only the affected threat boundary; do not turn every ordinary code change into a broad security audit.

Relevant completion evidence may include input validation, permission delta explanation, negative/boundary tests, data-recovery behavior, or current provider-policy verification when the provider capability materially changes.
