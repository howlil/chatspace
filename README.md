# Chatspace

Chatspace is a Chromium extension that turns rendered ChatGPT assistant responses into clean, animated cards directly inside the native conversation pane.

## Behavior

```text
ChatGPT response appears
-> Chatspace detects the rendered assistant element
-> the existing response is decorated in place
-> streaming continues natively inside the card
```

Forked/new ChatGPT conversations receive the same treatment automatically once their responses are rendered. Chatspace does not fetch hidden branch history or use private ChatGPT APIs.

## Safety boundary

Chatspace adds only a scoped style element and `data-chatspace-*` presentation attributes. It does not clone, move, rewrite, persist, or submit conversation content.

## Development

```bash
pnpm install
pnpm dev
pnpm verify
pnpm build
```
