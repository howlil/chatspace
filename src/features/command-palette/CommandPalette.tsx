import { Command, CornerDownLeft, ExternalLink, FileText, Folder, Search } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { rankRetrievalItems, type WorkspaceRetrievalItem } from '../../domain/workspace/retrieval';
import { Button, Input } from '../../ui/primitives';

export interface WorkspaceCommand {
  id: string;
  label: string;
  run: () => void;
}

export interface WorkspaceQuickOpenItem {
  id: string;
  kind: 'folder' | 'chat' | 'note';
  label: string;
  searchText?: string;
  run: () => void;
}

interface CommandPaletteProps {
  commands: WorkspaceCommand[];
  items?: WorkspaceQuickOpenItem[];
  onClose: () => void;
}

function iconFor(kind: WorkspaceRetrievalItem['kind']): ReactNode {
  if (kind === 'folder') return <Folder size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />;
  if (kind === 'chat') return <ExternalLink size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />;
  if (kind === 'note') return <FileText size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />;
  return <Command size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />;
}

function kindLabel(kind: WorkspaceRetrievalItem['kind']): string {
  if (kind === 'folder') return 'Folder';
  if (kind === 'chat') return 'Chat';
  if (kind === 'note') return 'Note';
  return 'Command';
}

export function CommandPalette({ commands, items = [], onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const retrievalItems = useMemo<WorkspaceRetrievalItem[]>(() => [
    ...items.map((item) => ({
      id: `artifact:${item.kind}:${item.id}`,
      kind: item.kind,
      label: item.label,
      searchText: item.searchText ?? item.label,
      run: item.run,
    })),
    ...commands.map((command) => ({
      id: `command:${command.id}`,
      kind: 'command' as const,
      label: command.label,
      searchText: command.label,
      run: command.run,
    })),
  ], [commands, items]);
  const visibleItems = useMemo(() => rankRetrievalItems(retrievalItems, query), [query, retrievalItems]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function runItem(item: WorkspaceRetrievalItem | undefined): void {
    if (item === undefined) return;
    item.run();
    onClose();
  }

  return (
    <Dialog.Root open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-14 z-[60] h-fit w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-cs-border bg-cs-panel shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">Quick-open local notes, saved chats, folders, and workspace commands.</Dialog.Description>
          <div className="flex h-10 items-center gap-2 border-b border-cs-border px-3">
            <Search size={14} className="shrink-0 text-cs-subtle" aria-hidden="true" />
            <Input
              autoFocus
              className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-xs text-cs-text shadow-none outline-none focus:border-transparent focus:ring-0"
              aria-label="Search notes, chats, folders, or commands"
              placeholder="Search notes, chats, folders, or commands…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveIndex((current) => visibleItems.length === 0 ? 0 : (current + 1) % visibleItems.length);
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveIndex((current) => visibleItems.length === 0 ? 0 : (current - 1 + visibleItems.length) % visibleItems.length);
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  runItem(visibleItems[activeIndex]);
                }
              }}
            />
            <kbd className="rounded border border-cs-border bg-cs-control px-1.5 py-0.5 text-[9px] text-cs-subtle">Esc</kbd>
          </div>
          <div className="max-h-[360px] overflow-y-auto p-1.5">
            {visibleItems.map((item, index) => (
              <Button
                variant="ghost"
                size="md"
                aria-label={item.label}
                data-active={index === activeIndex ? 'true' : 'false'}
                className={index === activeIndex
                  ? 'h-8 w-full justify-between bg-cs-active px-2.5 text-left text-[11px] text-cs-text'
                  : 'h-8 w-full justify-between px-2.5 text-left text-[11px] text-cs-muted'}
                key={item.id}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runItem(item)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {iconFor(item.kind)}
                  <span className="truncate">{item.label}</span>
                  <span className="shrink-0 text-[8px] uppercase tracking-wide text-cs-subtle">{kindLabel(item.kind)}</span>
                </span>
                {index === activeIndex && (
                  <kbd aria-hidden="true" className="flex items-center gap-1 text-[9px] text-cs-subtle">
                    Enter <CornerDownLeft size={9} />
                  </kbd>
                )}
              </Button>
            ))}
            {visibleItems.length === 0 && (
              <p className="m-0 px-3 py-5 text-center text-[10px] text-cs-subtle">No local matches.</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
