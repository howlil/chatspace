import type { ChatReference, LocalNote } from '../../domain/workspace/model';

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
    <button type="button" className="daily-home__item" onClick={() => onOpen(chat)}>
      <span aria-hidden="true">↗</span>
      <span><strong>{chat.label}</strong><small>{chat.pinned ? 'Pinned conversation' : 'Saved conversation'}</small></span>
    </button>
  );
}

function NoteItem({ note, onOpen }: { note: LocalNote; onOpen: (note: LocalNote) => void }) {
  return (
    <button type="button" className="daily-home__item" onClick={() => onOpen(note)}>
      <span aria-hidden="true">◇</span>
      <span><strong>{note.title}</strong><small>{note.tags.length > 0 ? note.tags.join(' · ') : 'Local note'}</small></span>
    </button>
  );
}

export function DailyHome({ chats, notes, status, onOpenChat, onOpenNote }: DailyHomeProps) {
  const recentChats = newest(chats, 5);
  const pinnedChats = chats.filter((chat) => chat.pinned).slice(0, 5);
  const recentNotes = newest(notes, 5);
  const empty = chats.length === 0 && notes.length === 0;

  return (
    <section className="daily-home" aria-label="Chatspace home">
      <header>
        <div><strong>Chatspace</strong><span>{status}</span></div>
      </header>

      {empty ? (
        <div className="daily-home__empty">
          <strong>Build your working set</strong>
          <p>Save a useful ChatGPT conversation or create a local note. They will appear here for fast return.</p>
        </div>
      ) : (
        <div className="daily-home__grid">
          <section>
            <h2>Continue</h2>
            {recentChats.length > 0 ? recentChats.map((chat) => <ChatItem key={chat.id} chat={chat} onOpen={onOpenChat} />) : <p>No saved conversations yet.</p>}
          </section>

          {pinnedChats.length > 0 && (
            <section>
              <h2>Pinned</h2>
              {pinnedChats.map((chat) => <ChatItem key={chat.id} chat={chat} onOpen={onOpenChat} />)}
            </section>
          )}

          {recentNotes.length > 0 && (
            <section>
              <h2>Recent notes</h2>
              {recentNotes.map((note) => <NoteItem key={note.id} note={note} onOpen={onOpenNote} />)}
            </section>
          )}
        </div>
      )}
    </section>
  );
}
