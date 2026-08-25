import { useEffect, useState } from 'react';

import type { WorkspaceFolder } from '../../domain/workspace/model';

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
    <div className="save-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section className="save-dialog" role="dialog" aria-modal="true" aria-labelledby="save-conversation-title">
        <header>
          <div>
            <strong id="save-conversation-title">Save conversation</strong>
            <span>Keep a local reference to this ChatGPT conversation.</span>
          </div>
          <button type="button" aria-label="Close save conversation" onClick={onCancel}>×</button>
        </header>

        <label>
          <span>Name</span>
          <input
            autoFocus
            aria-label="Conversation name"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Name this conversation"
          />
        </label>

        <label>
          <span>Folder</span>
          <select aria-label="Conversation folder" value={folderId} onChange={(event) => setFolderId(event.target.value)}>
            <option value="">Workspace root</option>
            {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </label>

        <label className="save-dialog__check">
          <input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} />
          <span>Pin this conversation</span>
        </label>

        <div className="save-dialog__target" title={target}>{target}</div>

        <footer>
          <button type="button" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="save-dialog__primary"
            disabled={cleanLabel.length === 0}
            onClick={() => onSave({ label: cleanLabel, folderId: folderId === '' ? null : folderId, pinned })}
          >
            Save
          </button>
        </footer>
      </section>
    </div>
  );
}
