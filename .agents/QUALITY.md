# Quality

Verification should protect the risks introduced by direct DOM decoration, not recreate a browser in tests.

## Required checks

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Deterministic test targets

- URL validation accepts only supported ChatGPT conversation routes;
- assistant messages are decorated while user messages remain native;
- decoration never rewrites provider message children/text;
- visible response-variant controls change only Chatspace card state;
- responses added after mount are decorated on refresh;
- disconnect removes Chatspace attributes/styles.

## Failure standard

A provider DOM mismatch must fail visually closed: native ChatGPT remains usable and undecorated. No test should require private APIs, cookies, network interception, browser automation, or synthetic end-to-end ceremony.
