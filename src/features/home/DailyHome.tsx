import { FileText, Inbox, MessageSquareText, Pin, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

import { INBOX_FOLDER_ID, type ChatReference, type LocalNote } from '../../domain/workspace/model';
import { Panel } from '../../ui/primitives';
import { WorkspaceHeader } from '../../ui/workspace';

interface DailyHomeProps {
  chats: ChatReference[];
  notes: LocalNote[];
  status: string;
  onOpenChat: (chat: ChatReference) => void;
  onOpenNote: (note: LocalNote) => void;
}

function newest<T extends { updatedAt: number }>(items: T[], limit: number): T[] {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

function ChatItem({ chat, onOpen }: { chat: ChatReference; onOpen: (chat: ChatReference) => void }) {
  return (
    <button type="button" className="group flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-cs-hover focus-visible:bg-cs-active" onClick={() => onOpen(chat)}>
      <span className="grid size-7 shrink-0 place-items-center rounded-md border border-cs-border bg-cs-surface text-cs-subtle group-hover:text-cs-muted"><MessageSquareText size={13} strokeWidth={1.7} aria-hidden="true" /></span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-[11px] font-medium text-cs-text">{chat.label}</strong>
        <small className="truncate text-[9px] text-cs-subtle">{chat.pinned ? 'Pinned conversation' : 'Saved conversation'}</small>
      </span>
      {chat.pinned && <Pin size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />}
    </button>
  );
}

function NoteItem({ note, onOpen, inbox = false }: { note: LocalNote; onOpen: (note: LocalNote) => void; inbox?: boolean }) {
  return (
    <button type="button" className="group flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-cs-hover focus-visible:bg-cs-active" onClick={() => onOpen(note)}>
      <span className="grid size-7 shrink-0 place-items-center rounded-md border border-cs-border bg-cs-surface text-cs-subtle group-hover:text-cs-muted">{inbox ? <Inbox size={13} strokeWidth={1.7} aria-hidden="true" /> : <FileText size={13} strokeWidth={1.7} aria-hidden="true" />}</span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-[11px] font-medium text-cs-text">{note.title}</strong>
        <small className="truncate text-[9px] text-cs-subtle">{inbox ? 'Inbox capture' : note.tags.length > 0 ? note.tags.join(' · ') : 'Local note'}</small>
      </span>
    </button>
  );
}

function HomeSection({ title, children }: { title: string; children: ReactNode }) {
  const id = `home-section-${title.toLowerCase().replaceAll(' ', '-').replaceAll('·', '')}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-cs-subtle">{title}</h2>
      <Panel className="overflow-hidden p-1">{children}</Panel>
    </section>
  );
}

export function DailyHome({ chats, notes, status, onOpenChat, onOpenNote }: DailyHomeProps) {
  const inboxNotes = newest(notes.filter((note) => note.folderId === INBOX_FOLDER_ID), 5);
  const recentChats = newest(chats, 5);
  const pinnedChats = chats.filter((chat) => chat.pinned).slice(0, 5);
  const recentNotes = newest(notes.filter((note) => note.folderId !== INBOX_FOLDER_ID), 5);
  const empty = chats.length === 0 && notes.length === 0;

  return (
    <section className="h-full min-h-0 overflow-y-auto" aria-label="Chatspace home">
      <div className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-5 sm:px-5">
        <WorkspaceHeader title="Workspace" description={status} />

        {empty ? (
          <Panel className="grid min-h-44 place-items-center px-6 py-8 text-center">
            <div className="grid max-w-sm justify-items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg border border-cs-border bg-cs-surface text-cs-muted"><Sparkles size={15} strokeWidth={1.6} aria-hidden="true" /></span>
              <strong className="text-xs font-medium">Build your working set</strong>
              <p className="m-0 text-[10px] leading-5 text-cs-muted">Quick capture a thought, save a useful ChatGPT conversation, or create a local note.</p>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-5 min-[760px]:grid-cols-2">
            {inboxNotes.length > 0 && (
              <HomeSection title={`Inbox · ${notes.filter((note) => note.folderId === INBOX_FOLDER_ID).length}`}>
                {inboxNotes.map((note) => <NoteItem key={note.id} note={note} inbox onOpen={onOpenNote} />)}
              </HomeSection>
            )}

            <HomeSection title="Continue">
              {recentChats.length > 0 ? recentChats.map((chat) => <ChatItem key={chat.id} chat={chat} onOpen={onOpenChat} />) : <p className="m-0 px-2.5 py-4 text-[10px] text-cs-subtle">No saved conversations yet.</p>}
            </HomeSection>

            {pinnedChats.length > 0 && <HomeSection title="Pinned">{pinnedChats.map((chat) => <ChatItem key={chat.id} chat={chat} onOpen={onOpenChat} />)}</HomeSection>}

            {recentNotes.length > 0 && <HomeSection title="Recent notes">{recentNotes.map((note) => <NoteItem key={note.id} note={note} onOpen={onOpenNote} />)}</HomeSection>}
          </div>
        )}
      </div>
    </section>
  );
}
