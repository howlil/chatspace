import { FolderInput, MessageSquareText, Pencil, Pin, PinOff } from 'lucide-react';

import type { ChatReference, WorkspaceFolder } from '../../domain/workspace/model';
import { Button, Panel, Select } from '../../ui/primitives';

interface ChatDetailsProps {
  chat: ChatReference;
  folder?: WorkspaceFolder;
  folders: WorkspaceFolder[];
  onRename: () => void;
  onTogglePin: () => void;
  onMove: (folderId: string | null) => void;
}

export function ChatDetails({ chat, folder, folders, onRename, onTogglePin, onMove }: ChatDetailsProps) {
  return (
    <section className="h-full min-h-0 overflow-y-auto">
      <div className="mx-auto grid w-full max-w-xl gap-4 px-4 py-5 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/[0.075] bg-white/[0.03] text-cs-muted">
            <MessageSquareText size={16} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="grid min-w-0 flex-1 gap-1">
            <h1 className="m-0 truncate text-[15px] font-semibold tracking-[-0.02em]">{chat.label}</h1>
            <p className="m-0 text-[10px] text-cs-muted">
              {folder?.name ?? 'Workspace root'} · {chat.pinned ? 'Pinned' : 'Saved conversation'}
            </p>
          </div>
        </div>

        <Panel className="grid gap-3 p-3">
          <div className="grid gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-cs-subtle">Last activity</span>
            <span className="text-[10px] text-cs-muted">{new Date(chat.updatedAt).toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button onClick={onRename}><Pencil size={11} aria-hidden="true" /> Rename</Button>
            <Button onClick={onTogglePin}>
              {chat.pinned ? <PinOff size={11} aria-hidden="true" /> : <Pin size={11} aria-hidden="true" />}
              {chat.pinned ? 'Unpin' : 'Pin'}
            </Button>
          </div>
        </Panel>

        <Panel className="grid gap-2 p-3">
          <label className="grid gap-1.5">
            <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-cs-subtle">
              <FolderInput size={10} aria-hidden="true" /> Location
            </span>
            <Select
              aria-label={`Move ${chat.label}`}
              value={chat.folderId ?? ''}
              onChange={(event) => onMove(event.target.value === '' ? null : event.target.value)}
            >
              <option value="">Workspace root</option>
              {folders.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </label>
        </Panel>
      </div>
    </section>
  );
}
