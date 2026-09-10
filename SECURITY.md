# Security

## Trust boundary

Chatspace executes as a Chromium content script on `https://chatgpt.com/*`. ChatGPT remains authoritative for message generation, native composer state, tools, authentication, navigation, and branching.

Allowed:

- validate supported ChatGPT conversation URLs;
- inspect the rendered active conversation region;
- read rendered role/message ids, visible content, streaming state, and visible branch controls;
- project sanitized rendered markup into a Chatspace-owned inspector;
- visually hide native turn containers only after a valid canvas exists;
- persist structural graph metadata that contains no transcript content;
- focus the existing native composer or click an existing native fork control after explicit user action.

Forbidden:

- cookies, credentials, auth/session material;
- private/undocumented ChatGPT APIs;
- network interception or replay;
- automatic message submission;
- rewriting provider message text, child order, links, code blocks, tools, ids, or composer content;
- transcript/content persistence or telemetry.

## Rendered markup

Inspector markup is copied from already-rendered provider content through an allowlist sanitizer. Script/style/form/embedded executable or interactive provider elements are dropped, event attributes are removed, and link/image URL schemes are restricted.

## Failure mode

If route validation, provider selectors, or graph projection cannot be trusted, Chatspace restores/leaves native ChatGPT visible rather than guessing hidden provider state.
