import { Database, Download, RotateCcw, Upload } from 'lucide-react';
import { useState } from 'react';

import { Button, Panel, Textarea } from '../../ui/primitives';
import { InlineFeedback, WorkspaceHeader } from '../../ui/workspace';

interface SettingsPanelProps {
  exportJson: string;
  recoveryJson: string | null;
  persistenceError: string | null;
  onImport: (json: string) => Promise<void>;
  onReset: () => Promise<void>;
  onDownload: (filename: string, content: string) => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The operation failed.';
}

function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-cs-border px-3 py-2.5">
        <div className="grid gap-0.5">
          <strong className="text-[11px] font-medium">{title}</strong>
          {description !== undefined && <p className="m-0 text-[9px] leading-4 text-cs-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children !== undefined && <div className="p-3">{children}</div>}
    </Panel>
  );
}

export function SettingsPanel({ exportJson, recoveryJson, persistenceError, onImport, onReset, onDownload }: SettingsPanelProps) {
  const [importText, setImportText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function importBackup() {
    setBusy(true);
    setActionError(null);
    try {
      await onImport(importText);
      setImportText('');
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset() {
    setBusy(true);
    setActionError(null);
    try {
      await onReset();
      setResetArmed(false);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-4" aria-label="Chatspace settings">
      <WorkspaceHeader
        icon={Database}
        title="Local workspace"
        description="Extension-owned storage and recovery."
      />

      <SettingsCard
        title="Local data"
        description="Workspace metadata, notes, graph relationships, tabs, and validated ChatGPT conversation URLs stay in extension-local storage."
      >
        {persistenceError !== null ? (
          <InlineFeedback tone="danger">{persistenceError}</InlineFeedback>
        ) : (
          <p className="m-0 text-[9px] leading-4 text-cs-muted">Storage is healthy. Provider credentials and ChatGPT output are not stored.</p>
        )}
      </SettingsCard>

      <SettingsCard
        title="Backup"
        description="Export the canonical local workspace as JSON."
        action={(
          <Button onClick={() => onDownload('chatspace-workspace.json', exportJson)}>
            <Download size={11} aria-hidden="true" /> Download
          </Button>
        )}
      >
        <Textarea className="h-28 w-full resize-none font-mono text-[9px] leading-4" aria-label="Workspace export" readOnly value={exportJson} />
      </SettingsCard>

      {recoveryJson !== null && (
        <SettingsCard
          title="Raw recovery payload"
          description="The stored payload failed schema validation and will not be overwritten automatically."
          action={(
            <Button
              aria-label="Download recovery"
              variant="danger"
              onClick={() => onDownload('chatspace-recovery.json', recoveryJson)}
            >
              <Download size={11} aria-hidden="true" /> Recovery
            </Button>
          )}
        >
          <Textarea className="h-28 w-full resize-none font-mono text-[9px] leading-4" aria-label="Raw recovery payload" readOnly value={recoveryJson} />
        </SettingsCard>
      )}

      <div className="grid gap-4 min-[760px]:grid-cols-2">
        <SettingsCard title="Import" description="Restore a schema-valid Chatspace backup.">
          <div className="grid gap-2">
            <Textarea
              className="h-24 w-full resize-none font-mono text-[9px] leading-4"
              aria-label="Workspace import"
              placeholder="Paste a Chatspace backup JSON"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
            <Button className="justify-self-start" disabled={busy || importText.trim() === ''} onClick={() => void importBackup()}>
              <Upload size={11} aria-hidden="true" /> Import backup
            </Button>
          </div>
        </SettingsCard>

        <SettingsCard title="Reset" description="Delete only Chatspace-owned local state.">
          {!resetArmed ? (
            <Button variant="danger" disabled={busy} onClick={() => setResetArmed(true)}>
              <RotateCcw size={11} aria-hidden="true" /> Reset local data
            </Button>
          ) : (
            <div className="grid gap-2">
              <span className="text-[9px] leading-4 text-cs-danger">This deletes Chatspace-owned local data only.</span>
              <div className="flex gap-1.5">
                <Button variant="danger" disabled={busy} onClick={() => void confirmReset()}>Confirm reset</Button>
                <Button variant="ghost" disabled={busy} onClick={() => setResetArmed(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </SettingsCard>
      </div>

      {actionError !== null && (
        <InlineFeedback tone="danger">{actionError}</InlineFeedback>
      )}
      <p className="m-0 px-1 text-[9px] leading-4 text-cs-subtle">
        No provider cookies, auth tokens, private API responses, or automatically extracted ChatGPT output are stored by Chatspace.
      </p>
    </section>
  );
}
