
import { BookmarkPlus, Link2, Pin, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useState } from 'react';

import type { WorkspaceFolder } from '../../domain/workspace/model';
import { Button, Checkbox, IconButton, Input, Select } from '../../ui/primitives';

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

  const cleanLabel = label.trim();
  const folderOptions = [
    { value: '', label: 'Workspace root' },
    ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
  ];

  return (
    <Dialog.Root open={open && target !== null} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-cs-border bg-cs-panel shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <header className="flex items-start gap-3 border-b border-cs-border px-4 py-3.5">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-cs-border bg-cs-surface text-cs-muted">
              <BookmarkPlus size={15} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <Dialog.Title asChild>
                <strong className="text-xs font-semibold">Save conversation</strong>
              </Dialog.Title>
              <Dialog.Description className="text-[10px] leading-4 text-cs-muted">
                Keep a local reference to this ChatGPT conversation.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton className="-mr-1 -mt-1 text-cs-subtle" aria-label="Close save conversation">
                <X size={13} aria-hidden="true" />
              </IconButton>
            </Dialog.Close>
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

            <div className="grid gap-1.5">
              <span className="text-[10px] font-medium text-cs-muted">Folder</span>
              <Select
                className="h-8 text-xs"
                aria-label="Conversation folder"
                value={folderId}
                options={folderOptions}
                onValueChange={setFolderId}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-cs-border bg-cs-control px-2.5 py-2 text-[10px] text-cs-muted hover:bg-cs-hover">
              <Checkbox
                aria-label="Pin this conversation"
                checked={pinned}
                onCheckedChange={setPinned}
              />
              <Pin size={11} aria-hidden="true" />
              <span>Pin this conversation</span>
            </label>

            {target !== null && (
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-cs-border bg-cs-bg px-2.5 py-2 text-[9px] text-cs-subtle" title={target}>
                <Link2 size={11} className="shrink-0" aria-hidden="true" />
                <span className="truncate font-mono">{target}</span>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-cs-border bg-cs-surface/60 px-4 py-3">
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button
              variant="primary"
              disabled={cleanLabel.length === 0}
              onClick={() => onSave({ label: cleanLabel, folderId: folderId === '' ? null : folderId, pinned })}
            >
              Save
            </Button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
