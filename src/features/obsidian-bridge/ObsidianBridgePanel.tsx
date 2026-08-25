import { Cable, ShieldCheck, Unplug } from 'lucide-react';
import { useState } from 'react';

import { Button, Input, Panel, SectionLabel } from '../../ui/primitives';

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
    <section className="grid gap-1.5" aria-label="Local vault bridge">
      <SectionLabel className="px-1">Optional integration</SectionLabel>
      <Panel className="p-3">
        <div className="flex items-start gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-cs-border bg-cs-surface text-cs-subtle">
            <Cable size={13} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <strong className="text-[11px] font-medium">Local vault bridge</strong>
            <p className="m-0 text-[9px] leading-4 text-cs-muted">
              Optional localhost-only Markdown sync. The bearer token stays in memory and is never written to workspace storage.
            </p>
          </div>
          {state === 'connected' && (
            <span className="flex shrink-0 items-center gap-1 text-[9px] text-cs-muted">
              <ShieldCheck size={11} aria-hidden="true" /> Connected
            </span>
          )}
        </div>

        <div className="mt-3">
          {state === 'connected' ? (
            <Button variant="ghost" onClick={onDisconnect}>
              <Unplug size={11} aria-hidden="true" /> Disconnect bridge
            </Button>
          ) : (
            <div className="flex min-w-0 gap-1.5">
              <Input
                className="min-w-0 flex-1"
                aria-label="Bridge token"
                type="password"
                autoComplete="off"
                placeholder="Bridge token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
              <Button disabled={state === 'connecting'} onClick={() => void connect()}>
                {state === 'connecting' ? 'Connecting…' : 'Connect bridge'}
              </Button>
            </div>
          )}
        </div>

        {(localError ?? message) !== null && (
          <p className="mb-0 mt-2 text-[9px] leading-4 text-cs-danger" role="alert">{localError ?? message}</p>
        )}
        {state === 'connected' && (
          <p className="mb-0 mt-2 text-[9px] text-cs-subtle">Connected for this session.</p>
        )}
      </Panel>
    </section>
  );
}
