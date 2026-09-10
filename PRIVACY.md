# Privacy

Chatspace runs locally in the browser on `https://chatgpt.com/*`.

## What Chatspace reads

Chatspace reads the rendered ChatGPT conversation DOM needed to build the local canvas: user/assistant role, rendered message ids when present, visible text/markup, streaming state, and visible native branch controls.

## What Chatspace stores

The extension uses Chromium `storage` for structural graph metadata only:

- local node ids;
- rendered provider message-id aliases;
- parent relationships;
- conversation target -> known path references.

Prompt text, assistant response text, rendered HTML, cookies, credentials, auth/session material, and tool output are not persisted.

## What Chatspace does not do

Chatspace does not call private ChatGPT APIs, intercept network traffic, export conversation content, add telemetry, or automatically submit messages. The Continue action may focus/reveal the existing native ChatGPT composer; ChatGPT remains the owner of composer content and submission.
