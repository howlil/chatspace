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

type ContinueItem =
  | { kind: 'chat'; item: ChatReference }
  | { kind: 'note'; item: LocalNote };

function newest<T extends { updatedAt: number }>(items: T[], limit: number): T[] {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

function relativeTime(updatedAt: number): string {
  const deltaMs = Math.max(0, Date.now() - updatedAt);
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(updatedAt).toLocaleDateString();
}

function ChatItem({ chat, onOpen, showPin = false }: { chat: ChatReference; onOpen: (chat: ChatReference) => void; showPin?: boolean }) {
  const detail = chat.annotation !== '' ? chat.annotation : `Chat · ${relativeTime(chat.updatedAt)}`;
  return (
    <button type="button" className="group flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-cs-hover focus-visible:bg-cs-active" onClick={() => onOpen(chat)}>
      <span className="grid size-7 shrink-0 place-items-center rounded-md border border-cs-border bg-cs-surface text-cs-subtle group-hover:text-cs-muted"><MessageSquareText size={13} strokeWidth={1.7} aria-hidden="true" /></span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-[11px] font-medium text-cs-text">{chat.label}</strong>
        <small className="truncate text-[9px] text-cs-subtle">{detail}</small>
      </span>
      {showPin && chat.pinned && <Pin size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />}
    </button>
  );
}

function NoteItem({ note, onOpen, inbox = false }: { note: LocalNote; onOpen: (note: LocalNote) => void; inbox?: boolean }) {
  const detail = inbox
    ? 'Inbox capture'
    : note.tags.length > 0
      ? `${note.tags.join(' · ')} · ${relativeTime(note.updatedAt)}`
      : `Note · ${relativeTime(note.updatedAt)}`;
  return (
    <button type="button" className="group flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-cs-hover focus-visible:bg-cs-active" onClick={() => onOpen(note)}>
      <span className="grid size-7 shrink-0 place-items-center rounded-md border border-cs-border bg-cs-surface text-cs-subtle group-hover:text-cs-muted">{inbox ? <Inbox size={13} strokeWidth={1.7} aria-hidden="true" /> : <FileText size={13} strokeWidth={1.7} aria-hidden="true" />}</span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-[11px] font-medium text-cs-text">{note.title}</strong>
        <small className="truncate text-[9px] text-cs-subtle">{detail}</small>
      </span>
    </button>
  );
}

function ContinueRow({ item, onOpenChat, onOpenNote }: { item: ContinueItem; onOpenChat: (chat: ChatReference) => void; onOpenNote: (note: LocalNote) => void }) {
  return item.kind === 'chat'
    ? <ChatItem chat={item.item} onOpen={onOpenChat} showPin />
    : <NoteItem note={item.item} onOpen={onOpenNote} />;
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
  const continueItems = newest<ContinueItem>([
    ...chats.map((chat) => ({ kind: 'chat' as const, item: chat, updatedAt: chat.updatedAt })),
    ...notes
      .filter((note) => note.folderId !== INBOX_FOLDER_ID)
      .map((note) => ({ kind: 'note' as const, item: note, updatedAt: note.updatedAt })),
  ] as Array<ContinueItem & { updatedAt: number }>, 8);
  const pinnedChats = newest(chats.filter((chat) => chat.pinned), 5);
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
              <p className="m-0 text-[10px] leading-5 text-cs-muted">Save a useful ChatGPT conversation, quick capture a thought, or create a local note.</p>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-5 min-[760px]:grid-cols-2">
            {continueItems.length > 0 && (
              <HomeSection title="Continue">
                {continueItems.map((entry) => (
                  <ContinueRow
                    key={`${entry.kind}:${entry.item.id}`}
                    item={entry}
                    onOpenChat={onOpenChat}
                    onOpenNote={onOpenNote}
                  />
                ))}
              </HomeSection>
            )}

            {inboxNotes.length > 0 && (
              <HomeSection title={`Inbox · ${notes.filter((note) => note.folderId === INBOX_FOLDER_ID).length}`}>
                {inboxNotes.map((note) => <NoteItem key={note.id} note={note} inbox onOpen={onOpenNote} />)}
              </HomeSection>
            )}

            {pinnedChats.length > 0 && (
              <HomeSection title="Pinned">
                {pinnedChats.map((chat) => <ChatItem key={chat.id} chat={chat} showPin onOpen={onOpenChat} />)}
              </HomeSection>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
