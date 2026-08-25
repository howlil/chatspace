# Chatspace

Chatspace is a local-first spatial workspace layer for long-form AI conversations. The extension preserves the provider-owned conversation experience and adds local organization, notes, graph navigation, and keyboard-first workspace controls.

## Development

Requirements: Node 22.12+ and npm 12.0.2.

```bash
npm install
npm run dev
npm run verify
npm run build
```

For Chromium development, run `npm run dev`, then load the generated WXT development extension from Chrome/Edge's **Load unpacked** flow.

## Safety boundary

Chatspace does not implement a private ChatGPT network client and does not crawl or extract conversation output. Provider-specific behavior is isolated behind a narrow compatibility adapter and local features remain usable when provider integration is unavailable.
