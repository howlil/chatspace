import { ArrowUpRight, FilePlus2, FileText, FolderInput, MessageSquareText, Pencil, Pin, PinOff } from 'lucide-react';

import type { ChatReference, LocalNote, WorkspaceFolder } from '../../domain/workspace/model';
import { Button, Panel, Select, Textarea } from '../../ui/primitives';

interface ChatDetailsProps {
  chat: ChatReference;
  folder: WorkspaceFolder | undefined;
  folders: WorkspaceFolder[];
  linkedNotes: LocalNote[];
  onResume: () => void;
  onDistill: () => void;
  onOpenNote: (note: LocalNote) => void;
  onRename: () => void;
  onAnnotationChange: (annotation: string) => void;
  onTogglePin: () => void;
  onMove: (folderId: string | null) => void;
}

export function ChatDetails({
  chat,
  folder,
  folders,
  linkedNotes,
  onResume,
  onDistill,
  onOpenNote,
  onRename,
  onAnnotationChange,
  onTogglePin,
  onMove,
}: ChatDetailsProps) {
  return (
    <section className="h-full min-h-0 overflow-y-auto">
      <div className="mx-auto grid w-full max-w-xl gap-4 px-4 py-5 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-cs-border bg-cs-surface text-cs-muted">
            <MessageSquareText size={16} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="grid min-w-0 flex-1 gap-1">
            <h1 className="m-0 truncate text-[15px] font-semibold tracking-[-0.02em]">{chat.label}</h1>
            <p className="m-0 text-[10px] text-cs-muted">
              {folder?.name ?? 'Workspace root'} · {chat.pinned ? 'Pinned' : 'Saved conversation'}
            </p>
          </div>
        </div>

        <Panel className="flex flex-wrap items-center gap-1.5 p-2">
          <Button onClick={onResume}><ArrowUpRight size={11} aria-hidden="true" /> Resume conversation</Button>
          {linkedNotes.length === 0 && (
            <Button variant="ghost" onClick={onDistill}><FilePlus2 size={11} aria-hidden="true" /> Distill to note</Button>
          )}
        </Panel>

        <Panel className="grid gap-2 p-3">
          <label className="grid gap-1.5">
            <span className="flex items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-cs-subtle">
              <span>Why saved</span>
              <span className="normal-case tracking-normal font-normal">Local context</span>
            </span>
            <Textarea
              aria-label="Why saved"
              className="min-h-20 resize-none text-[11px] leading-5"
              value={chat.annotation}
              onChange={(event) => onAnnotationChange(event.target.value)}
              placeholder="Add a short reason so this conversation is recognizable later."
              maxLength={500}
            />
          </label>
          <p className="m-0 text-[9px] leading-4 text-cs-subtle">This is user-authored local metadata. Chatspace does not copy ChatGPT conversation content.</p>
        </Panel>

        {linkedNotes.length > 0 && (
          <Panel className="grid gap-2 p-2" aria-label="Knowledge from this conversation">
            <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-cs-subtle">Knowledge</span>
              <span className="text-[9px] tabular-nums text-cs-subtle">{linkedNotes.length} linked</span>
            </div>
            <div className="grid gap-0.5">
              {linkedNotes.map((note) => (
                <Button key={note.id} variant="ghost" className="h-8 min-w-0 justify-start px-2 text-[10px]" onClick={() => onOpenNote(note)}>
                  <FileText size={10} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{note.title}</span>
                </Button>
              ))}
            </div>
            <Button variant="ghost" className="justify-start" onClick={onDistill}>
              <FilePlus2 size={11} aria-hidden="true" /> New note from conversation
            </Button>
          </Panel>
        )}

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
              options={[
                { value: '', label: 'Workspace root' },
                ...folders.map((item) => ({ value: item.id, label: item.name })),
              ]}
              onValueChange={(value) => onMove(value === '' ? null : value)}
            />
          </label>
        </Panel>
      </div>
    </section>
  );
}
