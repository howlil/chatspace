# Chatspace local vault bridge

The companion is optional. It binds only to `127.0.0.1`, requires a bearer token, and writes Markdown only below `<vault>/Chatspace/`.

```bash
export CHATSPACE_VAULT_DIR="/absolute/path/to/your/ObsidianVault"
export CHATSPACE_BRIDGE_TOKEN="use-a-random-token-at-least-16-chars"
npm run bridge
```

Then open Chatspace Settings, choose **Connect bridge**, enter the same token, and approve the narrow localhost permission. The token is session-only in the extension and is not written into workspace storage.

The bridge accepts only `GET /health` and `POST /notes`. It does not receive ChatGPT cookies, session state, conversation bodies, or browser credentials.
