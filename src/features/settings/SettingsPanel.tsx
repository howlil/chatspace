import { useState } from 'react';

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
    <section className="settings-panel" aria-label="Chatspace settings">
      <div className="settings-section">
        <h3>Local data</h3>
        <p>Chatspace stores workspace metadata, notes, graph relationships, tabs, and validated ChatGPT conversation URLs in extension-local storage.</p>
        {persistenceError !== null && <div className="settings-warning" role="alert">{persistenceError}</div>}
      </div>

      <div className="settings-section">
        <div className="settings-heading-row"><h3>Backup</h3><button type="button" onClick={() => onDownload('chatspace-workspace.json', exportJson)}>Download backup</button></div>
        <textarea aria-label="Workspace export" readOnly value={exportJson} />
      </div>

      {recoveryJson !== null && (
        <div className="settings-section settings-section--warning">
          <div className="settings-heading-row"><h3>Raw recovery payload</h3><button type="button" onClick={() => onDownload('chatspace-recovery.json', recoveryJson)}>Download recovery</button></div>
          <p>The stored payload failed schema validation and will not be overwritten automatically.</p>
          <textarea aria-label="Raw recovery payload" readOnly value={recoveryJson} />
        </div>
      )}

      <div className="settings-section">
        <h3>Import</h3>
        <textarea aria-label="Workspace import" placeholder="Paste a Chatspace backup JSON" value={importText} onChange={(event) => setImportText(event.target.value)} />
        <button type="button" disabled={busy || importText.trim() === ''} onClick={() => void importBackup()}>Import backup</button>
      </div>

      <div className="settings-section">
        <h3>Reset</h3>
        {!resetArmed ? (
          <button type="button" disabled={busy} onClick={() => setResetArmed(true)}>Reset local data</button>
        ) : (
          <div className="reset-confirmation">
            <span>This deletes Chatspace-owned local data only.</span>
            <button type="button" disabled={busy} onClick={() => void confirmReset()}>Confirm reset</button>
            <button type="button" disabled={busy} onClick={() => setResetArmed(false)}>Cancel</button>
          </div>
        )}
      </div>

      {actionError !== null && <div className="settings-warning" role="alert">{actionError}</div>}
      <p className="settings-privacy">No provider cookies, auth tokens, private API responses, or automatically extracted ChatGPT output are stored by Chatspace.</p>
    </section>
  );
}
