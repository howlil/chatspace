import { BookmarkPlus, Link2, Pin, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { WorkspaceFolder } from '../../domain/workspace/model';
import { Button, IconButton, Input, Select } from '../../ui/primitives';

export interface SaveConversationInput {
  label: string;
  folderId: string | null;
  pinned: boolean;
}

interface SaveConversationDialogProps {
  open: boolean;
  target: string | null;
  folders: WorkspaceFolder[];
  defaultFolderId: string | null;
  defaultLabel: string;
  onCancel: () => void;
  onSave: (input: SaveConversationInput) => void;
}

export function SaveConversationDialog({
  open,
  target,
  folders,
  defaultFolderId,
  defaultLabel,
  onCancel,
  onSave,
}: SaveConversationDialogProps) {
  const [label, setLabel] = useState(defaultLabel);
  const [folderId, setFolderId] = useState(defaultFolderId ?? '');
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLabel(defaultLabel);
    setFolderId(defaultFolderId ?? '');
    setPinned(false);
  }, [defaultFolderId, defaultLabel, open]);

  if (!open || target === null) return null;

  const cleanLabel = label.trim();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="w-full max-w-md overflow-hidden rounded-xl border border-white/[0.10] bg-cs-panel shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-conversation-title"
      >
        <header className="flex items-start gap-3 border-b border-white/[0.075] px-4 py-3.5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-cs-muted">
            <BookmarkPlus size={15} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <strong id="save-conversation-title" className="text-xs font-semibold">Save conversation</strong>
            <span className="text-[10px] leading-4 text-cs-muted">Keep a local reference to this ChatGPT conversation.</span>
          </div>
          <IconButton className="-mr-1 -mt-1 text-cs-subtle" aria-label="Close save conversation" onClick={onCancel}>
            <X size={13} aria-hidden="true" />
          </IconButton>
        </header>

        <div className="grid gap-3.5 px-4 py-4">
          <label className="grid gap-1.5">
            <span className="text-[10px] font-medium text-cs-muted">Name</span>
            <Input
              autoFocus
              className="h-8 text-xs"
              aria-label="Conversation name"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Name this conversation"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[10px] font-medium text-cs-muted">Folder</span>
            <Select
              className="h-8 text-xs"
              aria-label="Conversation folder"
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
            >
              <option value="">Workspace root</option>
              {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </Select>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.02] px-2.5 py-2 text-[10px] text-cs-muted hover:bg-white/[0.035]">
            <input
              className="accent-white"
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />
            <Pin size={11} aria-hidden="true" />
            <span>Pin this conversation</span>
          </label>

          <div className="flex min-w-0 items-center gap-2 rounded-md border border-white/[0.065] bg-cs-bg px-2.5 py-2 text-[9px] text-cs-subtle" title={target}>
            <Link2 size={11} className="shrink-0" aria-hidden="true" />
            <span className="truncate font-mono">{target}</span>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-white/[0.075] bg-white/[0.015] px-4 py-3">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            variant="primary"
            disabled={cleanLabel.length === 0}
            onClick={() => onSave({ label: cleanLabel, folderId: folderId === '' ? null : folderId, pinned })}
          >
            Save
          </Button>
        </footer>
      </section>
    </div>
  );
}
