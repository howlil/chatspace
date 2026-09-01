import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  FolderOpen,
  HardDrive,
  RefreshCw,
  Unplug,
} from 'lucide-react';

import type { LocalNote } from '../../domain/workspace/model';
import type { VaultConnection } from '../../integrations/local-vault/BrowserLocalVault';
import { Button, Panel } from '../../ui/primitives';

export type VaultPageState =
  | 'loading'
  | 'unsupported'
  | 'disconnected'
  | 'connected'
  | 'permission-required'
  | 'error';

interface LocalVaultPageProps {
  state: VaultPageState;
  connection: VaultConnection | null;
  message: string | null;
  busy: boolean;
  activeNote: LocalNote | null;
  onBack: () => void;
  onConnect: () => Promise<void>;
  onReconnect: () => Promise<void>;
  onChangeVault: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSyncActiveNote: () => Promise<void>;
}

export function LocalVaultPage({
  state,
  connection,
  message,
  busy,
  activeNote,
  onBack,
  onConnect,
  onReconnect,
  onChangeVault,
  onDisconnect,
  onSyncActiveNote,
}: LocalVaultPageProps) {
  const connected = state === 'connected' && connection !== null;
  const permissionRequired = state === 'permission-required' && connection !== null;

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
              Save Chatspace notes directly into an Obsidian vault. No terminal, token, or local server required.
            </p>
          </div>
        </header>

        <Panel className="grid gap-3 p-3" aria-label="Obsidian vault connection">
          <div className="flex items-start gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-md border border-cs-border bg-cs-surface text-cs-muted">
              <FolderOpen size={12} aria-hidden="true" />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <strong className="text-[11px] font-medium">Obsidian vault</strong>

              {state === 'loading' && (
                <p className="m-0 text-[9px] leading-4 text-cs-muted">Checking the previously selected vault…</p>
              )}

              {state === 'unsupported' && (
                <p className="m-0 text-[9px] leading-4 text-cs-muted">
                  Direct folder access is not available in this browser context.
                </p>
              )}

              {state === 'disconnected' && (
                <p className="m-0 text-[9px] leading-4 text-cs-muted">
                  Choose your Obsidian vault folder once. Chatspace writes Markdown only inside its <code>Chatspace</code> subfolder.
                </p>
              )}

              {connected && (
                <div className="grid gap-0.5">
                  <span className="flex items-center gap-1 text-[9px] font-medium text-cs-text">
                    <CheckCircle2 size={10} aria-hidden="true" /> Connected to {connection.name}
                  </span>
                  <span className="text-[9px] leading-4 text-cs-muted">
                    Files are stored in {connection.name}/Chatspace/
                  </span>
                </div>
              )}

              {permissionRequired && (
                <div className="grid gap-0.5">
                  <span className="flex items-center gap-1 text-[9px] font-medium text-cs-text">
                    <AlertCircle size={10} aria-hidden="true" /> Permission required for {connection.name}
                  </span>
                  <span className="text-[9px] leading-4 text-cs-muted">
                    Reconnect to allow Chatspace to write Markdown to this vault again.
                  </span>
                </div>
              )}

              {state === 'error' && (
                <p className="m-0 text-[9px] leading-4 text-cs-danger">
                  {message ?? 'The Obsidian vault connection could not be used.'}
                </p>
              )}
            </div>
          </div>

          {message !== null && state !== 'error' && (
            <p className="m-0 rounded-md border border-cs-border bg-cs-surface px-2 py-1.5 text-[9px] leading-4 text-cs-muted">
              {message}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {state === 'disconnected' && (
              <Button disabled={busy} onClick={() => void onConnect()}>
                <FolderOpen size={11} aria-hidden="true" /> {busy ? 'Opening…' : 'Connect Obsidian'}
              </Button>
            )}

            {permissionRequired && (
              <Button disabled={busy} onClick={() => void onReconnect()}>
                <RefreshCw size={11} aria-hidden="true" /> {busy ? 'Reconnecting…' : 'Reconnect'}
              </Button>
            )}

            {(connected || permissionRequired || (state === 'error' && connection !== null)) && (
              <>
                <Button variant="secondary" disabled={busy} onClick={() => void onChangeVault()}>
                  <FolderOpen size={11} aria-hidden="true" /> Change vault
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => void onDisconnect()}>
                  <Unplug size={11} aria-hidden="true" /> Disconnect
                </Button>
              </>
            )}

            {state === 'error' && connection === null && (
              <Button disabled={busy} onClick={() => void onConnect()}>
                <FolderOpen size={11} aria-hidden="true" /> Try again
              </Button>
            )}
          </div>
        </Panel>

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
            <Button
              className="justify-self-start"
              disabled={!connected || busy}
              onClick={() => void onSyncActiveNote()}
            >
              <CloudUpload size={11} aria-hidden="true" /> {busy ? 'Syncing…' : 'Sync current note'}
            </Button>
          )}
        </Panel>
      </div>
    </main>
  );
}
