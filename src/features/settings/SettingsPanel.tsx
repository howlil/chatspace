import { Database, Download, HardDrive, RotateCcw, Upload } from 'lucide-react';
import { useState } from 'react';

import { exportWorkspaceJson, importWorkspaceJson } from '../../domain/workspace/io';
import {
  applyMarkdownImport,
  type MarkdownImportDecision,
  type MarkdownImportScan,
} from '../../domain/workspace/markdownImport';
import {
  scanMarkdownFolder,
  isMarkdownFolderImportSupported,
} from '../../integrations/markdown-import/BrowserMarkdownFolderImporter';
import {
  exportPortableWorkspaceJson,
  isPortableWorkspaceExportSupported,
  type PortableWorkspaceExportResult,
} from '../../integrations/portable-export/BrowserPortableWorkspaceExporter';
import { Button, Panel, Textarea } from '../../ui/primitives';
import { InlineFeedback, WorkspaceHeader } from '../../ui/workspace';
import { MarkdownImportPreview } from './MarkdownImportPreview';

interface SettingsPanelProps {
  exportJson: string;
  recoveryJson: string | null;
  persistenceError: string | null;
  onImport: (json: string) => Promise<void>;
  onReset: () => Promise<void>;
  onDownload: (filename: string, content: string) => void;
  onOpenMarkdownSync?: (() => void) | undefined;
  onPortableExport?: (workspaceJson: string) => Promise<PortableWorkspaceExportResult | null>;
  portableExportSupported?: boolean;
  onMarkdownScan?: (workspaceJson: string) => Promise<MarkdownImportScan | null>;
  markdownImportSupported?: boolean;
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

export function SettingsPanel({
  exportJson,
  recoveryJson,
  persistenceError,
  onImport,
  onReset,
  onDownload,
  onOpenMarkdownSync,
  onPortableExport = exportPortableWorkspaceJson,
  portableExportSupported = isPortableWorkspaceExportSupported(),
  onMarkdownScan = scanMarkdownFolder,
  markdownImportSupported = isMarkdownFolderImportSupported(),
}: SettingsPanelProps) {
  const [importText, setImportText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [portableMessage, setPortableMessage] = useState<string | null>(null);
  const [markdownMessage, setMarkdownMessage] = useState<string | null>(null);
  const [markdownScan, setMarkdownScan] = useState<MarkdownImportScan | null>(null);
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

  async function exportPortableKnowledge() {
    setBusy(true);
    setActionError(null);
    setPortableMessage(null);
    try {
      const result = await onPortableExport(exportJson);
      if (result !== null) {
        setPortableMessage(`Exported ${result.filesWritten} files to ${result.rootDirectoryName}.`);
      }
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function scanMarkdownKnowledge() {
    setBusy(true);
    setActionError(null);
    setMarkdownMessage(null);
    try {
      const scan = await onMarkdownScan(exportJson);
      if (scan !== null) setMarkdownScan(scan);
    } catch (error) {
      setActionError(errorMessage(error));
      setMarkdownScan(null);
    } finally {
      setBusy(false);
    }
  }

  async function confirmMarkdownImport(decisions: MarkdownImportDecision[]) {
    if (markdownScan === null) return;
    setBusy(true);
    setActionError(null);
    setMarkdownMessage(null);
    try {
      const current = importWorkspaceJson(exportJson);
      const result = applyMarkdownImport(current, markdownScan, decisions, Date.now());
      await onImport(exportWorkspaceJson(result.snapshot));
      const changed = result.imported + result.updated + result.duplicated;
      setMarkdownMessage(`Imported ${changed} note${changed === 1 ? '' : 's'} · ${result.skipped} skipped.`);
      setMarkdownScan(null);
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
        title="Settings"
        description="Local data, portability, and optional integrations."
      />

      <SettingsCard
        title="Local data"
        description="Workspace metadata, notes, relationships, tabs, and validated ChatGPT conversation URLs stay in extension-local storage."
      >
        {persistenceError !== null ? (
          <InlineFeedback tone="danger">{persistenceError}</InlineFeedback>
        ) : (
          <p className="m-0 text-[9px] leading-4 text-cs-muted">Storage is healthy. Provider credentials and ChatGPT output are not stored.</p>
        )}
      </SettingsCard>

      {onOpenMarkdownSync !== undefined && (
        <SettingsCard
          title="Markdown vault"
          description="Optional manual one-way sync to a user-selected local folder."
          action={(
            <Button onClick={onOpenMarkdownSync}>
              <HardDrive size={11} aria-hidden="true" /> Open integration
            </Button>
          )}
        >
          <p className="m-0 text-[9px] leading-4 text-cs-muted">Connect, change, disconnect, and sync the local Markdown vault only when you need the integration. It is not part of the daily save/find/resume path.</p>
        </SettingsCard>
      )}

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

      <SettingsCard
        title="Markdown round-trip"
        description="Explicitly scan existing Markdown before import, or export understandable Markdown back to a folder. This is not live sync."
        action={(
          <div className="flex shrink-0 gap-1.5">
            <Button
              variant="ghost"
              disabled={busy || !markdownImportSupported}
              aria-label="Import Markdown folder"
              onClick={() => void scanMarkdownKnowledge()}
            >
              <Upload size={11} aria-hidden="true" /> Import folder
            </Button>
            <Button
              disabled={busy || !portableExportSupported}
              aria-label="Export portable knowledge"
              onClick={() => void exportPortableKnowledge()}
            >
              <Download size={11} aria-hidden="true" /> Export folder
            </Button>
          </div>
        )}
      >
        <div className="grid gap-3 text-[9px] leading-4 text-cs-muted">
          <p className="m-0">
            Markdown import is read-only until review and explicit confirmation. Folder hierarchy, body Markdown, tags, wikilinks, and Chatspace note IDs are recognized. Existing notes are never silently overwritten or auto-merged.
          </p>
          <p className="m-0">
            Export keeps note Markdown and local hierarchy. Saved ChatGPT conversations export only Chatspace-owned reference metadata and validated URLs, never provider conversation content.
          </p>
          {!markdownImportSupported && <InlineFeedback>Markdown folder import requires browser File System Access support.</InlineFeedback>}
          {!portableExportSupported && <InlineFeedback>Direct folder export requires browser File System Access support.</InlineFeedback>}
          {portableMessage !== null && <InlineFeedback>{portableMessage}</InlineFeedback>}
          {markdownMessage !== null && <InlineFeedback>{markdownMessage}</InlineFeedback>}
          {markdownScan !== null && (
            <MarkdownImportPreview
              scan={markdownScan}
              busy={busy}
              onConfirm={(decisions) => void confirmMarkdownImport(decisions)}
              onCancel={() => setMarkdownScan(null)}
            />
          )}
        </div>
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
        <SettingsCard title="Restore JSON" description="Restore a schema-valid Chatspace backup.">
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

      {actionError !== null && <InlineFeedback tone="danger">{actionError}</InlineFeedback>}
      <p className="m-0 px-1 text-[9px] leading-4 text-cs-subtle">
        No provider cookies, auth tokens, private API responses, or automatically extracted ChatGPT output are stored, imported, or exported by Chatspace.
      </p>
    </section>
  );
}
