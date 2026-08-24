# Security, Privacy & Compliance

## 1. Principle

Chatspace is a browser extension injected into a sensitive authenticated application. Treat this as a high-trust integration surface even if the product stores only local metadata.

Security and policy constraints shape architecture. They are not release-time checkboxes.

## 2. Current OpenAI usage boundary

As of the repository's initial planning date (2026-08-25), OpenAI's individual Terms of Use effective 2026-01-01 state that users may not automatically or programmatically extract data or Output, and prohibit reverse engineering, interference/bypass of protections, and related misuse.

Reference:
- https://openai.com/policies/terms-of-use/
- Indonesian version: https://openai.com/id-ID/policies/terms-of-use/

Therefore Chatspace must not rely on automated/programmatic extraction of ChatGPT data/output from the live service.

Before implementing a provider-facing capability, re-check the current applicable terms/documentation because policies can change.

## 3. Forbidden implementation patterns

Do not implement:

- undocumented/private ChatGPT HTTP/GraphQL/WebSocket endpoints
- interception/replay of private provider network traffic
- cookie/session token reading or reuse
- credential harvesting
- bypass of CSP, anti-automation, rate limiting, or protective measures
- background crawling of conversation history
- automated extraction/scraping of ChatGPT data/output
- reverse engineering model/system internals
- hidden telemetry containing provider content

If a requested feature requires one of these, stop and redesign around a supported path.

## 4. Supported-source hierarchy

Prefer sources in this order:

1. Chatspace-owned local data
2. explicit user-created metadata
3. provider-documented browser/platform behavior
4. official user export/import pathways
5. official API/SDK/integration with appropriate credentials and terms
6. provider UI coexistence/navigation capabilities that do not violate policy

Anything else requires explicit legal/technical review before implementation.

## 5. Extension permissions

Follow least privilege.

Every manifest permission must have:

- concrete feature justification
- threat impact
- whether optional permission can replace required permission
- removal condition if feature is dropped

Avoid broad permissions such as `<all_urls>` when a specific host permission suffices.

Target early permission model should be limited to required ChatGPT origin(s), storage, and only platform APIs actually used.

## 6. Content script trust boundary

The host page is untrusted external input.

Never:

- evaluate host-provided JavaScript
- inject host text via unsanitized `innerHTML`
- trust attributes as validated IDs without checking
- allow host DOM to select arbitrary extension commands

Prefer Shadow DOM/style isolation so Chatspace CSS neither depends on nor pollutes provider styles.

## 7. Page/main-world execution

Avoid main-world page script execution unless a documented requirement makes isolated-world content scripts insufficient.

If main-world access is proposed:

- write a dedicated design/security note
- explain why isolated world cannot solve it
- define exact message schema
- validate all cross-world messages
- forbid credential/private-state transfer

## 8. Local persistence

Store only Chatspace-owned data necessary for the feature.

Never store:

- cookies
- session tokens
- auth headers
- passwords
- full provider network payloads
- hidden internal provider state

For user-created notes/chat references:

- make storage location/behavior explicit
- provide deletion/reset
- provide export when practical
- schema migrations must not silently discard data

## 9. Browser storage

IndexedDB/storage is not a secret vault. Do not treat local browser storage as secure credential storage.

Sensitive future integration credentials, if ever required, need a separate architecture review and should prefer provider-supported OAuth/token mechanisms with minimal scope.

## 10. Future localhost companion

A future filesystem bridge materially changes the threat model.

Required before implementation:

- bind loopback only
- random/paired session credential
- explicit user-selected vault root
- path canonicalization
- deny traversal outside root
- strict origin/client validation
- narrow command set (no arbitrary shell)
- request size limits
- CSRF/cross-site protections as applicable
- audit/security tests

Never expose a localhost API that writes arbitrary paths without authorization.

## 11. Markdown/filesystem safety

When a filesystem bridge exists:

- treat note filenames as untrusted input
- normalize/canonicalize paths
- atomic write where possible
- avoid overwriting without expected-version/check
- keep backups/recovery for migrations
- never execute Markdown content

## 12. Supply chain

For dependencies:

- minimize count
- pin lockfile
- review permission/runtime implications
- use automated dependency/security scanning
- avoid packages whose capability can be implemented safely with small platform code

Browser-extension dependencies execute in a privileged user context; convenience alone is not sufficient justification.

## 13. CSP

Respect MV3 CSP constraints.

No:

- `eval`
- remote executable scripts
- dynamic code fetched from provider pages

Bundle executable extension code with the extension package.

## 14. Logging

Diagnostics must redact by default.

Allowed examples:

```text
provider_capability_unavailable: conversation-navigation
workspace_migration_failed: schema=2->3
```

Disallowed:

```text
full conversation text
cookie/token values
raw DOM dumps from a user's conversation
```

## 15. Telemetry

MVP default: no remote analytics unless explicitly designed and disclosed.

If telemetry is introduced later:

- opt-in/clear disclosure where appropriate
- collect aggregate product events, not conversation content
- document retention
- allow disablement
- privacy review before release

## 16. Data deletion

"Reset Chatspace" should remove Chatspace-owned local data only and must not interact with/deleting provider data.

Provider conversation deletion stays a provider action.

## 17. Threat scenarios

### Malicious host markup
Could attempt to trick selectors/commands. Mitigation: semantic validation + narrow adapter + no raw HTML injection.

### XSS in local notes
Mitigation: render Markdown with safe escaping/sanitization; no arbitrary HTML execution by default.

### Over-broad extension permission
Mitigation: specific host permission and manifest review gate.

### Provider UI changes
Security risk if selectors begin targeting wrong elements. Mitigation: capability detection and fail closed.

### Corrupted IndexedDB
Mitigation: schema validation, recovery path, no silent reset.

### Dependency compromise
Mitigation: dependency minimization, lockfile, scans, review.

## 18. Compliance gate for every provider feature

Before coding, answer:

1. What exact provider data/action does this use?
2. Is the capability explicitly supported/permitted?
3. Does it extract/store provider data or Output programmatically?
4. Does it require undocumented endpoints or private state?
5. Can Chatspace deliver the user value with local metadata or an official export/API instead?
6. What happens when the capability disappears?

If answers 2–4 are unsafe/unclear, do not implement until resolved.

## 19. Security definition of done

For a PR touching permissions, provider adapter, persistence, rendering external text, or filesystem bridge:

- threat boundary reviewed
- new inputs validated
- permission delta explained
- no secrets/content in logs
- negative tests included where applicable
- failure is closed/recoverable
- current provider policy checked if capability changed materially
