import { Code2, Eye, FileText, Link2, Pencil, Tag, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import type { ChatReference, LocalNote } from '../../domain/workspace/model';
import { cn } from '../../ui/cn';
import { Button, IconButton, Input, Select } from '../../ui/primitives';

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
        blocks.push(
          <pre key={`code-${index}`} className="my-3 overflow-auto rounded-lg border border-white/[0.075] bg-cs-panel p-3 font-mono text-[11px] leading-5 text-cs-muted">
            <code>{codeLines.join('\n')}</code>
          </pre>,
        );
        codeLines = null;
      }
      continue;
    }

    if (codeLines !== null) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push(<h3 className="mb-1.5 mt-5 text-[13px] font-semibold" key={index}>{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 className="mb-2 mt-6 text-[15px] font-semibold tracking-[-0.015em]" key={index}>{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      blocks.push(<h1 className="mb-2 mt-7 text-[18px] font-semibold tracking-[-0.025em]" key={index}>{line.slice(2)}</h1>);
    } else if (/^[-*] /.test(line)) {
      blocks.push(
        <div className="my-1 flex gap-2 pl-2 text-[12px] leading-5" key={index}>
          <span className="text-cs-subtle" aria-hidden="true">•</span><span>{line.slice(2)}</span>
        </div>,
      );
    } else if (line.startsWith('> ')) {
      blocks.push(
        <blockquote className="my-3 border-l-2 border-white/15 pl-3 text-[12px] leading-5 text-cs-muted" key={index}>
          {line.slice(2)}
        </blockquote>,
      );
    } else if (line.trim() === '') {
      blocks.push(<div className="h-2" aria-hidden="true" key={index} />);
    } else {
      blocks.push(<p className="my-1 text-[12px] leading-6 text-cs-text/90" key={index}>{line}</p>);
    }
  }

  if (codeLines !== null) {
    blocks.push(
      <pre key="code-unclosed" className="my-3 overflow-auto rounded-lg border border-white/[0.075] bg-cs-panel p-3 font-mono text-[11px] leading-5 text-cs-muted">
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
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
    <section className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] bg-cs-bg" aria-label={`Edit note ${note.title}`}>
      <div className="flex min-w-0 items-center gap-2 border-b border-white/[0.065] px-3 py-2">
        <FileText size={13} className="shrink-0 text-cs-subtle" strokeWidth={1.7} aria-hidden="true" />
        <input
          className="h-7 min-w-0 flex-1 bg-transparent text-[13px] font-semibold tracking-[-0.015em] text-cs-text outline-none placeholder:text-cs-subtle"
          aria-label="Note title"
          value={note.title}
          onChange={(event) => onChange({ ...note, title: event.target.value })}
        />
        <div className="flex shrink-0 rounded-md border border-white/[0.075] bg-white/[0.025] p-0.5" role="group" aria-label="Note view mode">
          <button
            type="button"
            data-active={mode === 'edit' ? 'true' : 'false'}
            className={cn(
              'flex h-6 items-center gap-1 rounded px-2 text-[9px] font-medium text-cs-subtle outline-none transition-colors hover:text-cs-text focus-visible:ring-1 focus-visible:ring-white/25',
              mode === 'edit' && 'bg-white/[0.075] text-cs-text',
            )}
            onClick={() => setMode('edit')}
          >
            <Pencil size={10} aria-hidden="true" /> Edit
          </button>
          <button
            type="button"
            data-active={mode === 'preview' ? 'true' : 'false'}
            className={cn(
              'flex h-6 items-center gap-1 rounded px-2 text-[9px] font-medium text-cs-subtle outline-none transition-colors hover:text-cs-text focus-visible:ring-1 focus-visible:ring-white/25',
              mode === 'preview' && 'bg-white/[0.075] text-cs-text',
            )}
            onClick={() => setMode('preview')}
          >
            <Eye size={10} aria-hidden="true" /> Preview
          </button>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 border-b border-white/[0.055] bg-cs-panel/70 px-3 py-1.5">
        <Tag size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Note tags">
          {note.tags.map((tag) => (
            <span className="flex h-5 shrink-0 items-center gap-1 rounded border border-white/[0.075] bg-white/[0.025] pl-1.5 text-[9px] text-cs-muted" key={tag}>
              #{tag}
              <button
                type="button"
                className="grid h-full w-5 place-items-center text-cs-subtle outline-none hover:text-cs-text focus-visible:text-cs-text"
                aria-label={`Remove tag ${tag}`}
                onClick={() => onChange({ ...note, tags: note.tags.filter((item) => item !== tag) })}
              >
                <X size={9} aria-hidden="true" />
              </button>
            </span>
          ))}
          {note.tags.length === 0 && <span className="text-[9px] text-cs-subtle">No tags</span>}
        </div>
        <Input
          className="h-6 w-24 shrink-0 border-transparent bg-transparent px-1.5 text-[9px] focus:bg-cs-surface"
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
        <div className="min-h-0 overflow-hidden">
          <textarea
            className="h-full min-h-0 w-full resize-none border-0 bg-cs-bg px-4 py-4 font-mono text-[12px] leading-6 text-cs-text/90 outline-none placeholder:text-cs-subtle"
            aria-label="Markdown content"
            placeholder="Write Markdown…"
            value={note.content}
            onChange={(event) => onChange({ ...note, content: event.target.value })}
          />
        </div>
      ) : (
        <article className="min-h-0 overflow-y-auto px-5 py-5" aria-label="Markdown preview">
          <div className="mx-auto max-w-3xl">
            {note.content.trim() === '' ? (
              <div className="grid min-h-44 place-items-center text-center text-[10px] text-cs-subtle">
                <span>Nothing to preview yet.</span>
              </div>
            ) : renderSafeMarkdown(note.content)}
          </div>
        </article>
      )}

      <footer className="flex min-w-0 items-center justify-between gap-3 border-t border-white/[0.055] px-3 py-1.5 text-[9px] text-cs-subtle">
        <span className="flex shrink-0 items-center gap-1.5">
          <Code2 size={10} aria-hidden="true" /> {note.content.length} chars · {note.tags.length} tags
        </span>
        {chats.length > 0 && (
          <div className="flex min-w-0 items-center gap-1.5">
            <Link2 size={10} className="shrink-0" aria-hidden="true" />
            <Select
              className="h-6 max-w-40 text-[9px]"
              aria-label="Chat to link"
              value={selectedChatId}
              onChange={(event) => setSelectedChatId(event.target.value)}
            >
              <option value="">Select chat</option>
              {availableChats.map((chat) => <option key={chat.id} value={chat.id}>{chat.label}</option>)}
            </Select>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[9px]"
              disabled={selectedChatId === ''}
              onClick={() => {
                if (selectedChatId !== '') {
                  onLinkChat(selectedChatId);
                  setSelectedChatId('');
                }
              }}
            >
              Link chat
            </Button>
          </div>
        )}
      </footer>

      {note.linkedChatIds.length > 0 && (
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-t border-white/[0.05] bg-cs-panel/60 px-3 py-1.5" aria-label="Linked chats">
          {note.linkedChatIds.map((chatId) => {
            const chat = chats.find((candidate) => candidate.id === chatId);
            return (
              <span className="flex h-5 shrink-0 items-center gap-1 rounded border border-white/[0.065] bg-white/[0.02] px-1.5 text-[9px] text-cs-muted" key={chatId}>
                <Link2 size={9} aria-hidden="true" /> {chat?.label ?? chatId}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
