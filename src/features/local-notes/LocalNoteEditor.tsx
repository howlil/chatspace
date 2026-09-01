import { ChevronDown, ChevronUp, Code2, Dot, Eye, FileText, Link2, Pencil, Tag, X } from 'lucide-react';
import { ToggleGroup } from 'radix-ui';
import { useState, type ReactNode } from 'react';

import type { ChatReference, LocalNote } from '../../domain/workspace/model';
import { Button, IconButton, Input, Select } from '../../ui/primitives';

interface LocalNoteEditorProps {
  note: LocalNote;
  chats: ChatReference[];
  contextExpanded: boolean;
  onChange: (note: LocalNote) => void;
  onLinkChat: (chatId: string) => void;
  onToggleContext: () => void;
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
          <pre key={`code-${index}`} className="my-3 overflow-auto rounded-lg border border-cs-border bg-cs-panel p-3 font-mono text-[11px] leading-5 text-cs-muted">
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
        <div className="my-1 flex gap-1 pl-1 text-[12px] leading-5" key={index}>
          <Dot className="mt-[3px] shrink-0 text-cs-subtle" size={14} strokeWidth={2.2} aria-hidden="true" />
          <span>{line.slice(2)}</span>
        </div>,
      );
    } else if (line.startsWith('> ')) {
      blocks.push(
        <blockquote className="my-3 border-l-2 border-cs-border pl-3 text-[12px] leading-5 text-cs-muted" key={index}>
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
      <pre key="code-unclosed" className="my-3 overflow-auto rounded-lg border border-cs-border bg-cs-panel p-3 font-mono text-[11px] leading-5 text-cs-muted">
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
  }

  return blocks;
}

export function LocalNoteEditor({
  note,
  chats,
  contextExpanded,
  onChange,
  onLinkChat,
  onToggleContext,
}: LocalNoteEditorProps) {
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
      <div className="flex min-w-0 items-center gap-1.5 border-b border-cs-border px-2.5 py-1.5">
        <FileText size={12} className="shrink-0 text-cs-subtle" strokeWidth={1.7} aria-hidden="true" />
        <input
          className="h-6 min-w-0 flex-1 bg-transparent text-[12px] font-semibold tracking-[-0.015em] text-cs-text outline-none placeholder:text-cs-subtle"
          aria-label="Note title"
          title="Edit note title"
          placeholder="Untitled note"
          value={note.title}
          onChange={(event) => onChange({ ...note, title: event.target.value })}
          onBlur={() => {
            if (note.title.trim() === '') onChange({ ...note, title: 'Untitled note' });
          }}
        />
        <ToggleGroup.Root
          type="single"
          value={mode}
          aria-label="Note view mode"
          className="flex shrink-0 rounded-lg border border-cs-border bg-cs-surface p-0.5"
          onValueChange={(value) => {
            if (value === 'edit' || value === 'preview') setMode(value);
          }}
        >
          <ToggleGroup.Item
            value="edit"
            aria-label="Edit note"
            title="Edit"
            className="grid size-6 place-items-center rounded-md text-cs-subtle outline-none transition-colors hover:bg-cs-hover hover:text-cs-text focus-visible:ring-1 focus-visible:ring-cs-focus/50 data-[state=on]:bg-cs-text data-[state=on]:text-cs-bg data-[state=on]:shadow-sm"
          >
            <Pencil size={10} aria-hidden="true" />
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="preview"
            aria-label="Preview note"
            title="Preview"
            className="grid size-6 place-items-center rounded-md text-cs-subtle outline-none transition-colors hover:bg-cs-hover hover:text-cs-text focus-visible:ring-1 focus-visible:ring-cs-focus/50 data-[state=on]:bg-cs-text data-[state=on]:text-cs-bg data-[state=on]:shadow-sm"
          >
            <Eye size={10} aria-hidden="true" />
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 border-b border-cs-border bg-cs-panel/70 px-2.5 py-1">
        <Tag size={10} className="shrink-0 text-cs-subtle" aria-hidden="true" />
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Note tags">
          {note.tags.map((tag) => (
            <span className="flex h-5 shrink-0 items-center gap-1 rounded border border-cs-border bg-cs-control pl-1.5 text-[9px] text-cs-muted" key={tag}>
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
            className="h-full min-h-0 w-full resize-none border-0 bg-cs-bg px-3 py-3 font-mono text-[12px] leading-6 text-cs-text/90 outline-none placeholder:text-cs-subtle"
            aria-label="Markdown content"
            placeholder="Write Markdown…"
            value={note.content}
            onChange={(event) => onChange({ ...note, content: event.target.value })}
          />
        </div>
      ) : (
        <article className="min-h-0 overflow-y-auto px-4 py-4" aria-label="Markdown preview">
          <div className="mx-auto max-w-3xl">
            {note.content.trim() === '' ? (
              <div className="grid min-h-44 place-items-center text-center text-[10px] text-cs-subtle">
                <span>Nothing to preview yet.</span>
              </div>
            ) : renderSafeMarkdown(note.content)}
          </div>
        </article>
      )}

      <footer className="flex min-w-0 items-center justify-between gap-3 border-t border-cs-border px-2.5 py-1 text-[9px] text-cs-subtle">
        <span className="flex shrink-0 items-center gap-1.5">
          <Code2 size={10} aria-hidden="true" /> {note.content.length} chars · {note.tags.length} tags
        </span>
        <div className="flex min-w-0 items-center gap-1.5">
          {contextExpanded && chats.length > 0 && (
            <>
              <Link2 size={10} className="shrink-0" aria-hidden="true" />
<Select
  className="h-6 max-w-40 text-[9px]"
  aria-label="Chat to link"
  value={selectedChatId}
  options={[
    { value: '', label: 'Select chat' },
    ...availableChats.map((chat) => ({ value: chat.id, label: chat.label })),
  ]}
  onValueChange={setSelectedChatId}
/>
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
                <Link2 size={9} aria-hidden="true" /> Link chat
              </Button>
            </>
          )}
          <IconButton
            className="size-6 text-cs-subtle"
            aria-label={contextExpanded ? 'Collapse note context' : 'Expand note context'}
            title={contextExpanded ? 'Collapse note context' : 'Expand note context'}
            onClick={onToggleContext}
          >
            {contextExpanded ? <ChevronDown size={11} aria-hidden="true" /> : <ChevronUp size={11} aria-hidden="true" />}
          </IconButton>
        </div>
      </footer>

      {contextExpanded && note.linkedChatIds.length > 0 && (
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-t border-cs-border bg-cs-panel/60 px-2.5 py-1" aria-label="Linked chats">
          {note.linkedChatIds.map((chatId) => {
            const chat = chats.find((candidate) => candidate.id === chatId);
            return (
              <span className="flex h-5 shrink-0 items-center gap-1 rounded border border-cs-border bg-cs-control px-1.5 text-[9px] text-cs-muted" key={chatId}>
                <Link2 size={9} aria-hidden="true" /> {chat?.label ?? chatId}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
