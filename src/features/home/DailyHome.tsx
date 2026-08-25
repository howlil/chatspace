import { FileText, MessageSquareText, Pin, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

import type { ChatReference, LocalNote } from '../../domain/workspace/model';
import { Panel, SectionLabel } from '../../ui/primitives';

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
    <button
      type="button"
      className="group flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-white/[0.045] focus-visible:bg-white/[0.06]"
      onClick={() => onOpen(chat)}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-md border border-white/[0.07] bg-white/[0.025] text-cs-subtle group-hover:text-cs-muted">
        <MessageSquareText size={13} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-[11px] font-medium text-cs-text">{chat.label}</strong>
        <small className="truncate text-[9px] text-cs-subtle">{chat.pinned ? 'Pinned conversation' : 'Saved conversation'}</small>
      </span>
      {chat.pinned && <Pin size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />}
    </button>
  );
}

function NoteItem({ note, onOpen }: { note: LocalNote; onOpen: (note: LocalNote) => void }) {
  return (
    <button
      type="button"
      className="group flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-white/[0.045] focus-visible:bg-white/[0.06]"
      onClick={() => onOpen(note)}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-md border border-white/[0.07] bg-white/[0.025] text-cs-subtle group-hover:text-cs-muted">
        <FileText size={13} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-[11px] font-medium text-cs-text">{note.title}</strong>
        <small className="truncate text-[9px] text-cs-subtle">{note.tags.length > 0 ? note.tags.join(' · ') : 'Local note'}</small>
      </span>
    </button>
  );
}

function HomeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <SectionLabel className="mb-1.5 px-1">{title}</SectionLabel>
      <Panel className="overflow-hidden p-1">{children}</Panel>
    </section>
  );
}

export function DailyHome({ chats, notes, status, onOpenChat, onOpenNote }: DailyHomeProps) {
  const recentChats = newest(chats, 5);
  const pinnedChats = chats.filter((chat) => chat.pinned).slice(0, 5);
  const recentNotes = newest(notes, 5);
  const empty = chats.length === 0 && notes.length === 0;

  return (
    <section className="h-full min-h-0 overflow-y-auto" aria-label="Chatspace home">
      <div className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-5 sm:px-5">
        <header className="grid gap-1">
          <h1 className="m-0 text-[15px] font-semibold tracking-[-0.02em] text-cs-text">Workspace</h1>
          <p className="m-0 text-[10px] leading-4 text-cs-muted">{status}</p>
        </header>

        {empty ? (
          <Panel className="grid min-h-44 place-items-center px-6 py-8 text-center">
            <div className="grid max-w-sm justify-items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-cs-muted">
                <Sparkles size={15} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <strong className="text-xs font-medium">Build your working set</strong>
              <p className="m-0 text-[10px] leading-5 text-cs-muted">
                Save a useful ChatGPT conversation or create a local note. They will appear here for fast return.
              </p>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-5 min-[760px]:grid-cols-2">
            <HomeSection title="Continue">
              {recentChats.length > 0 ? (
                recentChats.map((chat) => <ChatItem key={chat.id} chat={chat} onOpen={onOpenChat} />)
              ) : (
                <p className="m-0 px-2.5 py-4 text-[10px] text-cs-subtle">No saved conversations yet.</p>
              )}
            </HomeSection>

            {pinnedChats.length > 0 && (
              <HomeSection title="Pinned">
                {pinnedChats.map((chat) => <ChatItem key={chat.id} chat={chat} onOpen={onOpenChat} />)}
              </HomeSection>
            )}

            {recentNotes.length > 0 && (
              <HomeSection title="Recent notes">
                {recentNotes.map((note) => <NoteItem key={note.id} note={note} onOpen={onOpenNote} />)}
              </HomeSection>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
