import { useState, type ReactNode } from 'react';

import type { ChatReference, LocalNote } from '../../domain/workspace/model';

interface LocalNoteEditorProps {
  note: LocalNote;
  chats: ChatReference[];
  onChange: (note: LocalNote) => void;
  onLinkChat: (chatId: string) => void;
}

type NoteMode = 'edit' | 'preview';

function renderSafeMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let codeLines: string[] | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';

    if (line.trim().startsWith('```')) {
      if (codeLines === null) {
        codeLines = [];
      } else {
        blocks.push(<pre key={`code-${index}`}><code>{codeLines.join('\n')}</code></pre>);
        codeLines = null;
      }
      continue;
    }

    if (codeLines !== null) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push(<h3 key={index}>{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 key={index}>{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      blocks.push(<h1 key={index}>{line.slice(2)}</h1>);
    } else if (/^[-*] /.test(line)) {
      blocks.push(<div className="markdown-list-item" key={index}><span aria-hidden="true">•</span><span>{line.slice(2)}</span></div>);
    } else if (line.startsWith('> ')) {
      blocks.push(<blockquote key={index}>{line.slice(2)}</blockquote>);
    } else if (line.trim() === '') {
      blocks.push(<div className="markdown-spacer" aria-hidden="true" key={index} />);
    } else {
      blocks.push(<p key={index}>{line}</p>);
    }
  }

  if (codeLines !== null) {
    blocks.push(<pre key="code-unclosed"><code>{codeLines.join('\n')}</code></pre>);
  }

  return blocks;
}

export function LocalNoteEditor({ note, chats, onChange, onLinkChat }: LocalNoteEditorProps) {
  const availableChats = chats.filter((chat) => !note.linkedChatIds.includes(chat.id));
  const [selectedChatId, setSelectedChatId] = useState(availableChats[0]?.id ?? '');
  const [mode, setMode] = useState<NoteMode>('edit');
  const [tagDraft, setTagDraft] = useState('');

  function addTag(): void {
    const tag = tagDraft.trim().toLowerCase();
    if (tag === '') return;
    if (!note.tags.includes(tag)) onChange({ ...note, tags: [...note.tags, tag] });
    setTagDraft('');
  }

  return (
    <section className="local-note-editor" aria-label={`Edit note ${note.title}`}>
      <div className="note-title-row">
        <input
          className="local-note-editor__title"
          aria-label="Note title"
          value={note.title}
          onChange={(event) => onChange({ ...note, title: event.target.value })}
        />
        <div className="note-mode-switch" role="group" aria-label="Note view mode">
          <button type="button" data-active={mode === 'edit' ? 'true' : 'false'} onClick={() => setMode('edit')}>Edit</button>
          <button type="button" data-active={mode === 'preview' ? 'true' : 'false'} onClick={() => setMode('preview')}>Preview</button>
        </div>
      </div>

      <div className="note-tag-row">
        <div className="note-tags" aria-label="Note tags">
          {note.tags.map((tag) => (
            <span className="note-tag" key={tag}>
              #{tag}
              <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => onChange({ ...note, tags: note.tags.filter((item) => item !== tag) })}>×</button>
            </span>
          ))}
        </div>
        <input
          aria-label="Add note tag"
          placeholder="Add tag"
          value={tagDraft}
          onChange={(event) => setTagDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
        />
      </div>

      {mode === 'edit' ? (
        <textarea
          className="local-note-editor__content"
          aria-label="Markdown content"
          placeholder="Write Markdown…"
          value={note.content}
          onChange={(event) => onChange({ ...note, content: event.target.value })}
        />
      ) : (
        <article className="local-note-preview" aria-label="Markdown preview">
          {note.content.trim() === '' ? <p className="note-preview-empty">Nothing to preview yet.</p> : renderSafeMarkdown(note.content)}
        </article>
      )}

      <footer className="local-note-editor__footer">
        <span>{note.content.length} chars · {note.tags.length} tags</span>
        {chats.length > 0 && (
          <div className="note-link-controls">
            <select aria-label="Chat to link" value={selectedChatId} onChange={(event) => setSelectedChatId(event.target.value)}>
              <option value="">Select chat</option>
              {availableChats.map((chat) => <option key={chat.id} value={chat.id}>{chat.label}</option>)}
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
            return <span key={chatId}>↗ {chat?.label ?? chatId}</span>;
          })}
        </div>
      )}
    </section>
  );
}
