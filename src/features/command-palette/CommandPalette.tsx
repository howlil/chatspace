import { Command, CornerDownLeft, ExternalLink, FileText, Filter, Folder, Search } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { rankRetrievalItems, type WorkspaceRetrievalItem } from '../../domain/workspace/retrieval';
import { Button, Input } from '../../ui/primitives';

export interface WorkspaceCommand {
  id: string;
  label: string;
  priority?: number;
  run: () => void;
}

export interface WorkspaceQuickOpenItem {
  id: string;
  kind: 'folder' | 'chat' | 'note' | 'view';
  label: string;
  searchText?: string;
  contextText?: string;
  contentText?: string;
  detail?: string;
  pinned?: boolean;
  updatedAt?: number;
  run: () => void;
}

interface CommandPaletteProps {
  commands: WorkspaceCommand[];
  items?: WorkspaceQuickOpenItem[];
  onClose: () => void;
}

interface RetrievalGroup {
  label: string;
  items: WorkspaceRetrievalItem[];
}

function iconFor(kind: WorkspaceRetrievalItem['kind']): ReactNode {
  if (kind === 'folder') return <Folder size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />;
  if (kind === 'chat') return <ExternalLink size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />;
  if (kind === 'note') return <FileText size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />;
  if (kind === 'view') return <Filter size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />;
  return <Command size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />;
}

function kindLabel(kind: WorkspaceRetrievalItem['kind']): string {
  if (kind === 'folder') return 'Folder';
  if (kind === 'chat') return 'Chat';
  if (kind === 'note') return 'Note';
  if (kind === 'view') return 'View';
  return 'Action';
}

function buildGroups(items: WorkspaceRetrievalItem[], query: string): RetrievalGroup[] {
  const trimmed = query.trim();
  if (trimmed === '') {
    const pinned = items.filter((item) => (item.kind === 'chat' || item.kind === 'note') && item.pinned === true);
    const recent = items.filter((item) => (item.kind === 'chat' || item.kind === 'note') && item.pinned !== true);
    const folders = items.filter((item) => item.kind === 'folder');
    const commands = items.filter((item) => item.kind === 'command');
    return [
      { label: 'Continue', items: recent },
      { label: 'Pinned', items: pinned },
      { label: 'Library', items: folders },
      { label: 'Actions', items: commands },
    ].filter((group) => group.items.length > 0);
  }

  const definitions: Array<[string, WorkspaceRetrievalItem['kind']]> = [
    ['Chats', 'chat'],
    ['Notes', 'note'],
    ['Folders', 'folder'],
    ['Actions', 'command'],
    ['Saved views', 'view'],
  ];
  return definitions
    .map(([label, kind]) => ({ label, items: items.filter((item) => item.kind === kind) }))
    .filter((group) => group.items.length > 0);
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
      contextText: item.contextText,
      contentText: item.contentText,
      detail: item.detail,
      pinned: item.pinned,
      updatedAt: item.updatedAt,
      run: item.run,
    })),
    ...commands.map((command) => ({
      id: `command:${command.id}`,
      kind: 'command' as const,
      label: command.label,
      searchText: command.label,
      priority: command.priority,
      run: command.run,
    })),
  ], [commands, items]);
  const rankedItems = useMemo(() => rankRetrievalItems(retrievalItems, query), [query, retrievalItems]);
  const groups = useMemo(() => buildGroups(rankedItems, query), [query, rankedItems]);
  const visibleItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function runItem(item: WorkspaceRetrievalItem | undefined): void {
    if (item === undefined) return;
    item.run();
    onClose();
  }

  let renderedIndex = 0;

  return (
    <Dialog.Root open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-14 z-[60] h-fit w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-cs-border bg-cs-panel shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <Dialog.Title className="sr-only">Quick open</Dialog.Title>
          <Dialog.Description className="sr-only">Find recent local work first, then folders and workspace actions.</Dialog.Description>
          <div className="flex h-10 items-center gap-2 border-b border-cs-border px-3">
            <Search size={14} className="shrink-0 text-cs-subtle" aria-hidden="true" />
            <Input
              autoFocus
              className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-xs text-cs-text shadow-none outline-none focus:border-transparent focus:ring-0"
              aria-label="Search notes, chats, folders, views, or commands"
              placeholder="Find chats, notes, folders, or actions…"
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
          <div className="max-h-[380px] overflow-y-auto p-1.5">
            {groups.map((group) => (
              <section key={group.label} className="mb-1 last:mb-0" aria-label={group.label}>
                <h3 className="px-2.5 pb-1 pt-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-cs-subtle">{group.label}</h3>
                {group.items.map((item) => {
                  const index = renderedIndex;
                  renderedIndex += 1;
                  return (
                    <Button
                      variant="ghost"
                      size="md"
                      aria-label={item.label}
                      data-active={index === activeIndex ? 'true' : 'false'}
                      className={index === activeIndex
                        ? 'min-h-9 h-auto w-full justify-between bg-cs-active px-2.5 py-1.5 text-left text-[11px] text-cs-text'
                        : 'min-h-9 h-auto w-full justify-between px-2.5 py-1.5 text-left text-[11px] text-cs-muted'}
                      key={item.id}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => runItem(item)}
                    >
                      <span className="flex min-w-0 items-start gap-2">
                        <span className="mt-0.5">{iconFor(item.kind)}</span>
                        <span className="grid min-w-0 gap-0.5">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate">{item.label}</span>
                            <span className="shrink-0 text-[8px] uppercase tracking-wide text-cs-subtle">{kindLabel(item.kind)}</span>
                          </span>
                          {item.detail !== undefined && item.detail !== '' && (
                            <small className="truncate text-[9px] font-normal text-cs-subtle">{item.detail}</small>
                          )}
                        </span>
                      </span>
                      {index === activeIndex && (
                        <kbd aria-hidden="true" className="flex shrink-0 items-center gap-1 text-[9px] text-cs-subtle">
                          Enter <CornerDownLeft size={9} />
                        </kbd>
                      )}
                    </Button>
                  );
                })}
              </section>
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
