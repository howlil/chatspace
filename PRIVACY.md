# Privacy

Chatspace runs locally in the browser on `https://chatgpt.com/*`.

The active runtime does not persist, export, transmit, or log ChatGPT conversation text. It reads rendered message structure only to identify assistant responses and applies local presentation attributes/styles to those existing DOM elements.

Chatspace does not access cookies, auth/session material, private APIs, network traffic, or the ChatGPT composer.

The extension requires only host access for `https://chatgpt.com/*`; the previous `storage`, `sidePanel`, and `scripting` permissions are not required by the main-pane card runtime.
