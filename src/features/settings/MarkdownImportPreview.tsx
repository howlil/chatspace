import { AlertTriangle, FileText, FolderTree, Link2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type {
  MarkdownImportAction,
  MarkdownImportDecision,
  MarkdownImportScan,
} from '../../domain/workspace/markdownImport';
import { Button, Input, Select } from '../../ui/primitives';
import { InlineFeedback } from '../../ui/workspace';

interface MarkdownImportPreviewProps {
  scan: MarkdownImportScan;
  busy: boolean;
  onConfirm: (decisions: MarkdownImportDecision[]) => void;
  onCancel: () => void;
}

function optionsFor(kind: MarkdownImportScan['conflicts'][number]['kind']) {
  if (kind === 'id-match') {
    return [
      { value: '', label: 'Choose resolution…' },
      { value: 'update-existing', label: 'Update existing' },
      { value: 'keep-existing', label: 'Keep existing' },
      { value: 'duplicate', label: 'Duplicate' },
    ];
  }
  return [
    { value: '', label: 'Choose resolution…' },
    { value: 'keep-existing', label: 'Keep existing' },
    { value: 'duplicate', label: 'Import as duplicate' },
    { value: 'rename-incoming', label: 'Rename incoming' },
    { value: 'skip', label: 'Skip' },
  ];
}

export function MarkdownImportPreview({ scan, busy, onConfirm, onCancel }: MarkdownImportPreviewProps) {
  const [decisions, setDecisions] = useState<Record<string, MarkdownImportDecision>>({});

  useEffect(() => setDecisions({}), [scan]);

  const ready = useMemo(() => scan.conflicts.every((conflict) => {
    const decision = decisions[conflict.sourcePath];
    if (decision === undefined) return false;
    return decision.action !== 'rename-incoming' || (decision.renameTo?.trim() ?? '') !== '';
  }), [decisions, scan.conflicts]);

  function setAction(sourcePath: string, action: string): void {
    if (action === '') {
      setDecisions((current) => {
        const next = { ...current };
        delete next[sourcePath];
        return next;
      });
      return;
    }
    setDecisions((current) => ({
      ...current,
      [sourcePath]: {
        sourcePath,
        action: action as MarkdownImportAction,
        renameTo: current[sourcePath]?.renameTo ?? null,
      },
    }));
  }

  return (
    <div className="grid gap-3" aria-label="Markdown import preview">
      <div className="grid grid-cols-2 gap-1.5 min-[680px]:grid-cols-5">
        <div className="rounded-md border border-cs-border bg-cs-panel px-2 py-1.5"><FileText size={10} className="mb-1 text-cs-subtle" aria-hidden="true" /><strong className="block text-[11px] tabular-nums">{scan.notes.length}</strong><span className="text-[8px] text-cs-subtle">notes</span></div>
        <div className="rounded-md border border-cs-border bg-cs-panel px-2 py-1.5"><FolderTree size={10} className="mb-1 text-cs-subtle" aria-hidden="true" /><strong className="block text-[11px] tabular-nums">{scan.folderCount}</strong><span className="text-[8px] text-cs-subtle">folders</span></div>
        <div className="rounded-md border border-cs-border bg-cs-panel px-2 py-1.5"><Link2 size={10} className="mb-1 text-cs-subtle" aria-hidden="true" /><strong className="block text-[11px] tabular-nums">{scan.resolvedLinks}</strong><span className="text-[8px] text-cs-subtle">resolved links</span></div>
        <div className="rounded-md border border-cs-border bg-cs-panel px-2 py-1.5"><Link2 size={10} className="mb-1 text-cs-subtle" aria-hidden="true" /><strong className="block text-[11px] tabular-nums">{scan.unresolvedLinks}</strong><span className="text-[8px] text-cs-subtle">unresolved</span></div>
        <div className="rounded-md border border-cs-border bg-cs-panel px-2 py-1.5"><AlertTriangle size={10} className="mb-1 text-cs-subtle" aria-hidden="true" /><strong className="block text-[11px] tabular-nums">{scan.conflicts.length}</strong><span className="text-[8px] text-cs-subtle">conflicts</span></div>
      </div>

      <p className="m-0 text-[9px] leading-4 text-cs-muted">
        Scanned <strong className="font-medium text-cs-text">{scan.rootName}</strong> read-only. Nothing changes until you confirm the import.
      </p>

      {scan.warnings.map((warning) => <InlineFeedback key={warning}>{warning}</InlineFeedback>)}

      {scan.conflicts.length > 0 && (
        <div className="grid gap-1.5" aria-label="Markdown import conflicts">
          {scan.conflicts.map((conflict) => {
            const incoming = scan.notes.find((note) => note.sourcePath === conflict.sourcePath);
            const decision = decisions[conflict.sourcePath];
            return (
              <div key={conflict.sourcePath} className="grid gap-1.5 rounded-lg border border-cs-border bg-cs-panel/55 p-2">
                <div className="min-w-0 text-[9px] leading-4">
                  <strong className="block truncate font-medium text-cs-text">Incoming: {incoming?.title ?? conflict.sourcePath}</strong>
                  {conflict.existingTitle !== null && <span className="block truncate text-cs-muted">Existing: {conflict.existingTitle}</span>}
                  {conflict.incomingPeerPath !== null && <span className="block truncate text-cs-muted">Also incoming: {conflict.incomingPeerPath}</span>}
                  <span className="block truncate text-[8px] text-cs-subtle">{conflict.sourcePath}</span>
                </div>
                <div className="flex min-w-0 gap-1.5">
                  <Select
                    className="h-7 min-w-0 flex-1 text-[9px]"
                    aria-label={`Resolve ${conflict.sourcePath}`}
                    value={decision?.action ?? ''}
                    options={optionsFor(conflict.kind)}
                    onValueChange={(value) => setAction(conflict.sourcePath, value)}
                  />
                  {decision?.action === 'rename-incoming' && (
                    <Input
                      className="h-7 min-w-0 flex-1 text-[9px]"
                      aria-label={`Rename ${conflict.sourcePath}`}
                      placeholder="New note title"
                      value={decision.renameTo ?? ''}
                      onChange={(event) => setDecisions((current) => ({
                        ...current,
                        [conflict.sourcePath]: { ...decision, renameTo: event.target.value },
                      }))}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-1.5">
        <Button variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button>
        <Button disabled={busy || !ready} onClick={() => onConfirm(Object.values(decisions))}>
          Import {scan.notes.length} note{scan.notes.length === 1 ? '' : 's'}
        </Button>
      </div>
    </div>
  );
}