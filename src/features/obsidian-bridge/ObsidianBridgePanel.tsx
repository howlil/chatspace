import { useState } from 'react';

export type BridgeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ObsidianBridgePanelProps {
  state: BridgeConnectionState;
  message: string | null;
  onConnect: (token: string) => Promise<void>;
  onDisconnect: () => void;
}

export function ObsidianBridgePanel({
  state,
  message,
  onConnect,
  onDisconnect,
}: ObsidianBridgePanelProps) {
  const [token, setToken] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function connect(): Promise<void> {
    const normalized = token.trim();
    if (normalized === '') {
      setLocalError('Bridge token is required.');
      return;
    }
    setLocalError(null);
    try {
      await onConnect(normalized);
      setToken('');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Bridge connection failed.');
    }
  }

  return (
    <section className="obsidian-bridge-panel" aria-label="Local vault bridge">
      <div>
        <strong>Local vault bridge</strong>
        <p>
          Optional localhost-only sync for Markdown notes. The bearer token stays in memory and is
          never written to workspace storage.
        </p>
      </div>
      {state === 'connected' ? (
        <button type="button" onClick={onDisconnect}>Disconnect bridge</button>
      ) : (
        <div className="obsidian-bridge-connect">
          <input
            aria-label="Bridge token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <button type="button" disabled={state === 'connecting'} onClick={() => void connect()}>
            {state === 'connecting' ? 'Connecting…' : 'Connect bridge'}
          </button>
        </div>
      )}
      {(localError ?? message) !== null && <p role="alert">{localError ?? message}</p>}
      {state === 'connected' && <p className="bridge-connected">Connected for this session.</p>}
    </section>
  );
}
