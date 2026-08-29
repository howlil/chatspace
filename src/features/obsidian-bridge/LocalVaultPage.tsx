import { ArrowLeft, CloudUpload, HardDrive } from 'lucide-react';

import type { LocalNote } from '../../domain/workspace/model';
import { Button, Panel } from '../../ui/primitives';
import { ObsidianBridgePanel, type BridgeConnectionState } from './ObsidianBridgePanel';

interface LocalVaultPageProps {
  state: BridgeConnectionState;
  message: string | null;
  activeNote: LocalNote | null;
  onBack: () => void;
  onConnect: (token: string) => Promise<void>;
  onDisconnect: () => void;
  onSyncActiveNote: () => Promise<void>;
}

export function LocalVaultPage({
  state,
  message,
  activeNote,
  onBack,
  onConnect,
  onDisconnect,
  onSyncActiveNote,
}: LocalVaultPageProps) {
  return (
    <main className="h-full min-h-0 overflow-y-auto p-3" aria-label="Markdown sync">
      <div className="mx-auto grid w-full max-w-2xl gap-4 py-2">
        <Button variant="ghost" className="justify-self-start px-1.5" onClick={onBack}>
          <ArrowLeft size={11} aria-hidden="true" /> Back to workspace
        </Button>

        <header className="flex items-start gap-2.5 px-1">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-cs-border bg-cs-surface text-cs-muted">
            <HardDrive size={14} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="grid min-w-0 gap-0.5">
            <h1 className="m-0 text-sm font-semibold tracking-[-0.01em]">Markdown sync</h1>
            <p className="m-0 text-[10px] leading-4 text-cs-muted">
              Connect Chatspace to the optional localhost Markdown bridge without changing workspace storage ownership.
            </p>
          </div>
        </header>

        <ObsidianBridgePanel
          state={state}
          message={message}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />

        {state === 'connected' && (
          <Panel className="grid gap-3 p-3">
            <div className="grid gap-0.5">
              <strong className="text-[11px] font-medium">Current note</strong>
              {activeNote !== null ? (
                <p className="m-0 text-[9px] leading-4 text-cs-muted">{activeNote.title}</p>
              ) : (
                <p className="m-0 text-[9px] leading-4 text-cs-muted">Open a note in Chatspace to sync it.</p>
              )}
            </div>
            {activeNote !== null && (
              <Button className="justify-self-start" onClick={() => void onSyncActiveNote()}>
                <CloudUpload size={11} aria-hidden="true" /> Sync current note
              </Button>
            )}
          </Panel>
        )}
      </div>
    </main>
  );
}
