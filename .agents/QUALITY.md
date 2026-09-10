# Quality

Verification protects the actual risks of the main-pane conversation canvas without recreating ChatGPT in synthetic end-to-end tests.

## Required checks

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

CI additionally packages the Chromium extension and enforces the final relevant-gates verify job.

## Deterministic risk targets

- URL validation accepts only supported ChatGPT conversation routes;
- prompt-only -> completed assistant response remains one logical node;
- prompt and response provider ids alias to the same node;
- streaming/final content updates preserve the existing card DOM and do not create topology;
- native forks reuse a rendered shared prefix and create sibling children;
- topology growth preserves unaffected keyed card DOM;
- conversation discovery ignores message-like DOM outside the active main region;
- inspector HTML sanitizer drops executable/interactive markup and unsafe URL schemes;
- layered layout separates sibling subtrees and keeps constant node geometry;
- wheel pans, modifier-wheel zooms, and keyboard navigation moves predictably through parent/child/siblings;
- structural serialization contains no transcript text or rendered HTML;
- disconnect/provider mismatch restores native ChatGPT presentation.

## Failure standard

When provider structure cannot be interpreted safely, prefer native ChatGPT over a guessed canvas. Never weaken type/lint checks to make a provider mismatch pass.
