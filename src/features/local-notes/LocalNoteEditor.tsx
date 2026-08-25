import { useState } from 'react';

import type { ChatReference, LocalNote } from '../../domain/workspace/model';

interface LocalNoteEditorProps {
  note: LocalNote;
  chats: ChatReference[];
  onChange: (note: LocalNote) => void;
  onLinkChat: (chatId: string) => void;
}

export function LocalNoteEditor({ note, chats, onChange, onLinkChat }: LocalNoteEditorProps) {
  const availableChats = chats.filter((chat) => !note.linkedChatIds.includes(chat.id));
  const [selectedChatId, setSelectedChatId] = useState(availableChats[0]?.id ?? '');

  return (
    <section className="local-note-editor" aria-label={`Edit note ${note.title}`}>
      <input
        className="local-note-editor__title"
        aria-label="Note title"
        value={note.title}
        onChange={(event) => onChange({ ...note, title: event.target.value })}
      />
      <textarea
        className="local-note-editor__content"
        aria-label="Markdown content"
        placeholder="Write Markdown…"
        value={note.content}
        onChange={(event) => onChange({ ...note, content: event.target.value })}
      />
      <footer className="local-note-editor__footer">
        <span>{note.content.length} chars</span>
        {chats.length > 0 && (
          <div className="note-link-controls">
            <select
              aria-label="Chat to link"
              value={selectedChatId}
              onChange={(event) => setSelectedChatId(event.target.value)}
            >
              <option value="">Select chat</option>
              {availableChats.map((chat) => (
                <option key={chat.id} value={chat.id}>{chat.label}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={selectedChatId === ''}
              onClick={() => {
                if (selectedChatId !== '') {
                  onLinkChat(selectedChatId);
                  setSelectedChatId('');
                }
              }}
            >
              Link chat
            </button>
          </div>
        )}
      </footer>
      {note.linkedChatIds.length > 0 && (
        <div className="linked-chats" aria-label="Linked chats">
          {note.linkedChatIds.map((chatId) => {
            const chat = chats.find((candidate) => candidate.id === chatId);
            return <span key={chatId}>{chat?.label ?? chatId}</span>;
          })}
        </div>
      )}
    </section>
  );
}
