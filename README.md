# Chatspace

Chatspace is a local-first spatial workspace layer for long-form AI conversations. It preserves the provider-owned conversation experience while adding local folders, tabs, Markdown notes, graph navigation, backups, and keyboard-first workspace controls.

## v1 capabilities

- recoverable Shadow DOM extension shell on `https://chatgpt.com/*`
- nested local folders and explicit conversation URL references
- workspace tabs and `Ctrl/⌘ K` command palette
- local Markdown notes linked to saved conversation references
- deterministic graph projection with canonical/manual provenance
- schema-validated import/export, confirmed reset, and corrupted-storage recovery
- extension-owned persistence through `browser.storage.local`

## Development

Requirements: Node 22.12+ and npm 12.0.2.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

For Chromium development, run `npm run dev`, then load the generated WXT development extension from Chrome/Edge's **Load unpacked** flow.

CI reports lint, typecheck, tests, and production build as separate gates so failures remain diagnosable.

> Reproducibility note: direct dependency versions and npm are exact-pinned. A committed transitive `package-lock.json` is still required before a public store release; CI remains read-only and does not self-mutate the repository.

## Safety boundary

Chatspace does not implement a private ChatGPT network client and does not crawl or extract conversation output. Provider integration is limited to validated `https://chatgpt.com/c/<id>` navigation references. Local workspace features remain usable when provider integration is unavailable.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).
