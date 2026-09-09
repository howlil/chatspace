# Security

## Trust boundary

Chatspace executes as a Chromium content script on `https://chatgpt.com/*` and only augments rendered conversation DOM.

Allowed:

- validate the current ChatGPT conversation URL;
- inspect rendered role/structure needed to identify assistant responses;
- observe DOM child/provider-state attribute changes;
- add/remove Chatspace-owned presentation attributes and one scoped style element.

Forbidden:

- cookies, credentials, auth/session material;
- private/undocumented ChatGPT APIs;
- network interception or replay;
- composer manipulation or automatic submission;
- cloning, moving, replacing, or rewriting provider message content;
- transcript persistence or telemetry.

If provider DOM compatibility breaks, the safe failure mode is no decoration while native ChatGPT remains functional.
