import {
  Archive,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  House,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

import type { ChatReference, LocalNote, WorkspaceFolder } from '../../domain/workspace/model';
import {
  artifactKey,
  artifactMatchesFilter,
  folderMatchesQuery,
  matchesWorkspaceQuery,
  parseArtifactKey,
  type WorkspaceArtifactRef,
  type WorkspaceFilter,
} from '../../domain/workspace/retrieval';
import { cn } from '../../ui/cn';
import { Button, IconButton, SectionLabel, Select } from '../../ui/primitives';
import { SearchField } from '../../ui/workspace';

interface WorkspaceTreeProps {
  folders: WorkspaceFolder[];
  chatRefs: ChatReference[];
  notes: LocalNote[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onCreateNote: (folderId: string | null) => void;
  onRenameFolder: (folder: WorkspaceFolder) => void;
  onDeleteFolder: (folder: WorkspaceFolder) => void;
  onMoveFolder: (folder: WorkspaceFolder, parentId: string | null) => void;
  onOpenChat: (chat: ChatReference) => void;
  onOpenNote: (note: LocalNote) => void;
  onTogglePinChat: (chat: ChatReference) => void;
  onRenameChat: (chat: ChatReference) => void;
  onDeleteChat: (chat: ChatReference) => void;
  onRenameNote: (note: LocalNote) => void;
  onDeleteNote: (note: LocalNote) => void;
  onMoveChat: (chat: ChatReference, folderId: string | null) => void;
  onMoveNote: (note: LocalNote, folderId: string | null) => void;
  onBulkMove?: (refs: WorkspaceArtifactRef[], folderId: string | null) => void;
  onBulkPin?: (refs: WorkspaceArtifactRef[], pinned: boolean) => void;
  onBulkArchive?: (refs: WorkspaceArtifactRef[], archived: boolean) => void;
  onBulkDelete?: (refs: WorkspaceArtifactRef[]) => void;
}

type DragPayload =
  | { kind: 'folder'; id: string }
  | { kind: 'chat'; id: string }
  | { kind: 'note'; id: string };

type TreeContextTarget =
  | { kind: 'root'; id?: undefined }
  | { kind: 'folder'; id: string }
  | { kind: 'chat'; id: string }
  | { kind: 'note'; id: string };

interface TreeContextMenuState {
  target: TreeContextTarget;
  x: number;
  y: number;
}

const DRAG_MIME = 'application/x-chatspace-item';
const CONTEXT_MENU_WIDTH = 190;
const FILTER_OPTIONS: Array<{ value: WorkspaceFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'notes', label: 'Notes' },
  { value: 'chats', label: 'Chats' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'unfiled', label: 'Unfiled' },
  { value: 'archived', label: 'Archived' },
];

function startDrag(event: DragEvent<HTMLElement>, payload: DragPayload): void {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
}

function readDrag(event: DragEvent<HTMLElement>): DragPayload | null {
  const raw = event.dataTransfer.getData(DRAG_MIME);
  if (raw === '') return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DragPayload>;
    if ((parsed.kind === 'folder' || parsed.kind === 'chat' || parsed.kind === 'note') && typeof parsed.id === 'string') {
      return parsed as DragPayload;
    }
  } catch {
    return null;
  }
  return null;
}

function movePayload(props: WorkspaceTreeProps, payload: DragPayload, targetFolderId: string | null): void {
  if (payload.kind === 'folder') {
    const folder = props.folders.find((item) => item.id === payload.id);
    if (folder !== undefined) props.onMoveFolder(folder, targetFolderId);
    return;
  }
  if (payload.kind === 'chat') {
    const chat = props.chatRefs.find((item) => item.id === payload.id);
    if (chat !== undefined) props.onMoveChat(chat, targetFolderId);
    return;
  }
  const note = props.notes.find((item) => item.id === payload.id);
  if (note !== undefined) props.onMoveNote(note, targetFolderId);
}

function clampMenuPosition(x: number, y: number): { x: number; y: number } {
  const viewportWidth = typeof window === 'undefined' ? x + CONTEXT_MENU_WIDTH : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? y + 260 : window.innerHeight;
  return {
    x: Math.max(8, Math.min(x, viewportWidth - CONTEXT_MENU_WIDTH - 8)),
    y: Math.max(8, Math.min(y, viewportHeight - 260)),
  };
}

function MenuAction({
  icon,
  children,
  danger = false,
  onClick,
}: {
  icon: ReactNode;
  children: ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <DropdownMenu.Item
      className={cn(
        'flex h-8 w-full cursor-default items-center gap-2 rounded px-2 text-left text-[10px] outline-none data-[highlighted]:bg-cs-hover',
        danger ? 'text-cs-danger' : 'text-cs-muted data-[highlighted]:text-cs-text',
      )}
      onSelect={onClick}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </DropdownMenu.Item>
  );
}

interface LeafMenuProps {
  selected: boolean;
  selectionActive: boolean;
  onActivate: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
  onMenuButtonClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

function ChatLeaf({
  chat,
  depth,
  selected,
  selectionActive,
  onActivate,
  onTogglePinChat,
  onContextMenu,
  onMenuButtonClick,
}: {
  chat: ChatReference;
  depth: number;
  onTogglePinChat: (chat: ChatReference) => void;
} & LeafMenuProps) {
  return (
    <div
      className={cn(
        'group flex h-7 w-full min-w-0 items-center pr-1 text-cs-muted hover:bg-cs-hover',
        selected && 'bg-cs-active text-cs-text',
      )}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
      draggable={!selectionActive}
      onContextMenu={onContextMenu}
      onDragStart={(event) => startDrag(event, { kind: 'chat', id: chat.id })}
    >
      <button
        type="button"
        className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-sm px-1.5 text-left outline-none transition-colors hover:text-cs-text focus-visible:bg-cs-hover focus-visible:text-cs-text"
        title={chat.label}
        aria-pressed={selected}
        onClick={onActivate}
      >
        <ExternalLink className="shrink-0 text-cs-subtle" size={11} strokeWidth={1.7} aria-hidden="true" />
        <span className="truncate text-[11px]">{chat.label}</span>
      </button>
      <IconButton
        className={cn(
          'size-6 text-cs-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          chat.pinned && 'text-cs-muted opacity-100',
        )}
        aria-label={`${chat.pinned ? 'Unpin' : 'Pin'} ${chat.label}`}
        title={chat.pinned ? 'Unpin' : 'Pin'}
        onClick={() => onTogglePinChat(chat)}
      >
        <Star size={11} fill={chat.pinned ? 'currentColor' : 'none'} aria-hidden="true" />
      </IconButton>
      <IconButton
        className="size-6 text-cs-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Actions for ${chat.label}`}
        title="Actions"
        onClick={onMenuButtonClick}
      >
        <MoreHorizontal size={12} aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function NoteLeaf({ note, depth, selected, selectionActive, onActivate, onContextMenu, onMenuButtonClick }: {
  note: LocalNote;
  depth: number;
} & LeafMenuProps) {
  return (
    <div
      className={cn(
        'group flex h-7 w-full min-w-0 items-center pr-1 text-cs-muted hover:bg-cs-hover',
        selected && 'bg-cs-active text-cs-text',
      )}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
      draggable={!selectionActive}
      onContextMenu={onContextMenu}
      onDragStart={(event) => startDrag(event, { kind: 'note', id: note.id })}
    >
      <button
        type="button"
        className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-sm px-1.5 text-left outline-none transition-colors hover:text-cs-text focus-visible:bg-cs-hover focus-visible:text-cs-text"
        title={note.title}
        aria-pressed={selected}
        onClick={onActivate}
      >
        <FileText className="shrink-0 text-cs-subtle" size={12} strokeWidth={1.7} aria-hidden="true" />
        <span className="truncate text-[11px]">{note.title}</span>
      </button>
      <IconButton
        className="size-6 text-cs-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Actions for ${note.title}`}
        title="Actions"
        onClick={onMenuButtonClick}
      >
        <MoreHorizontal size={12} aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function orderedArtifacts(
  folders: WorkspaceFolder[],
  chats: ChatReference[],
  notes: LocalNote[],
  parentId: string | null = null,
): WorkspaceArtifactRef[] {
  const result: WorkspaceArtifactRef[] = [
    ...chats.filter((chat) => chat.folderId === parentId).map((chat) => ({ kind: 'chat' as const, id: chat.id })),
    ...notes.filter((note) => note.folderId === parentId).map((note) => ({ kind: 'note' as const, id: note.id })),
  ];
  for (const folder of folders.filter((item) => item.parentId === parentId)) {
    result.push(...orderedArtifacts(folders, chats, notes, folder.id));
  }
  return result;
}

export function WorkspaceTree(props: WorkspaceTreeProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<WorkspaceFilter>('all');
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<TreeContextMenuState | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);
  const normalized = query.trim().toLowerCase();

  const activeChats = useMemo(() => props.chatRefs.filter((chat) => chat.archivedAt === null), [props.chatRefs]);
  const activeNotes = useMemo(() => props.notes.filter((note) => note.archivedAt === null), [props.notes]);
  const filteredChats = useMemo(
    () => props.chatRefs.filter((chat) => artifactMatchesFilter(chat, 'chat', filter) && matchesWorkspaceQuery(chat, 'chat', query)),
    [filter, props.chatRefs, query],
  );
  const filteredNotes = useMemo(
    () => props.notes.filter((note) => artifactMatchesFilter(note, 'note', filter) && matchesWorkspaceQuery(note, 'note', query)),
    [filter, props.notes, query],
  );
  const filteredFolders = useMemo(
    () => filter === 'all' && normalized !== '' ? props.folders.filter((folder) => folderMatchesQuery(folder, query)) : [],
    [filter, normalized, props.folders, query],
  );
  const flatMode = normalized !== '' || filter !== 'all';
  const pinnedChats = activeChats.filter((chat) => chat.pinned);
  const visibleRefs = useMemo(
    () => flatMode
      ? [...filteredChats.map((chat) => ({ kind: 'chat' as const, id: chat.id })), ...filteredNotes.map((note) => ({ kind: 'note' as const, id: note.id }))]
      : orderedArtifacts(props.folders, activeChats, activeNotes),
    [activeChats, activeNotes, filteredChats, filteredNotes, flatMode, props.folders],
  );
  const selectedRefs = useMemo(
    () => [...selectedKeys].map(parseArtifactKey).filter((ref): ref is WorkspaceArtifactRef => ref !== null),
    [selectedKeys],
  );
  const selectedChatCount = selectedRefs.filter((ref) => ref.kind === 'chat').length;
  const selectedAreArchived = selectedRefs.length > 0 && selectedRefs.every((ref) => {
    const item = ref.kind === 'chat'
      ? props.chatRefs.find((chat) => chat.id === ref.id)
      : props.notes.find((note) => note.id === ref.id);
    return item?.archivedAt !== null;
  });

  useEffect(() => {
    if (selectedKeys.size === 0) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedKeys(new Set());
        setSelectionAnchor(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedKeys.size]);

  function clearSelection(): void {
    setSelectedKeys(new Set());
    setSelectionAnchor(null);
  }

  function selectOrOpen(
    event: ReactMouseEvent<HTMLButtonElement>,
    ref: WorkspaceArtifactRef,
    open: () => void,
  ): void {
    const key = artifactKey(ref);
    const selectionGesture = event.metaKey || event.ctrlKey || event.shiftKey || selectedKeys.size > 0;
    if (!selectionGesture) {
      open();
      return;
    }

    if (event.shiftKey && selectionAnchor !== null) {
      const orderedKeys = visibleRefs.map(artifactKey);
      const start = orderedKeys.indexOf(selectionAnchor);
      const end = orderedKeys.indexOf(key);
      if (start >= 0 && end >= 0) {
        const [from, to] = start < end ? [start, end] : [end, start];
        setSelectedKeys(new Set(orderedKeys.slice(from, to + 1)));
        return;
      }
    }

    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSelectionAnchor(key);
  }

  function openContextMenu(event: ReactMouseEvent<HTMLElement>, target: TreeContextTarget): void {
    event.preventDefault();
    event.stopPropagation();
    const position = clampMenuPosition(event.clientX, event.clientY);
    setContextMenu({ target, ...position });
  }

  function openMenuFromButton(event: ReactMouseEvent<HTMLButtonElement>, target: TreeContextTarget): void {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const position = clampMenuPosition(rect.right - CONTEXT_MENU_WIDTH, rect.bottom + 4);
    setContextMenu({ target, ...position });
  }

  function closeAndRun(action: () => void): void {
    setContextMenu(null);
    action();
  }

  const chatLeaf = (chat: ChatReference, key: string, depth = 0) => {
    const ref: WorkspaceArtifactRef = { kind: 'chat', id: chat.id };
    return (
      <ChatLeaf
        key={key}
        chat={chat}
        depth={depth}
        selected={selectedKeys.has(artifactKey(ref))}
        selectionActive={selectedKeys.size > 0}
        onActivate={(event) => selectOrOpen(event, ref, () => props.onOpenChat(chat))}
        onTogglePinChat={props.onTogglePinChat}
        onContextMenu={(event) => openContextMenu(event, ref)}
        onMenuButtonClick={(event) => openMenuFromButton(event, ref)}
      />
    );
  };

  const noteLeaf = (note: LocalNote, key: string, depth = 0) => {
    const ref: WorkspaceArtifactRef = { kind: 'note', id: note.id };
    return (
      <NoteLeaf
        key={key}
        note={note}
        depth={depth}
        selected={selectedKeys.has(artifactKey(ref))}
        selectionActive={selectedKeys.size > 0}
        onActivate={(event) => selectOrOpen(event, ref, () => props.onOpenNote(note))}
        onContextMenu={(event) => openContextMenu(event, ref)}
        onMenuButtonClick={(event) => openMenuFromButton(event, ref)}
      />
    );
  };

  function renderFolderBranch(parentId: string | null, depth: number): ReactNode {
    return props.folders.filter((folder) => folder.parentId === parentId).map((folder) => {
      const active = props.selectedFolderId === folder.id;
      const dropActive = dropTargetId === folder.id;
      return (
        <div key={folder.id}>
          <div
            className={cn(
              'group flex h-7 min-w-0 items-center pr-1 transition-colors hover:bg-cs-hover',
              active && 'bg-cs-active text-cs-text',
              dropActive && 'bg-cs-active ring-1 ring-inset ring-cs-focus/40',
            )}
            style={{ paddingLeft: `${4 + depth * 14}px` }}
            draggable
            onContextMenu={(event) => openContextMenu(event, { kind: 'folder', id: folder.id })}
            onDragStart={(event) => {
              event.stopPropagation();
              startDrag(event, { kind: 'folder', id: folder.id });
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDropTargetId(folder.id);
            }}
            onDragLeave={() => {
              if (dropTargetId === folder.id) setDropTargetId(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDropTargetId(null);
              const payload = readDrag(event);
              if (payload !== null) movePayload(props, payload, folder.id);
            }}
          >
            <IconButton
              className="size-5 shrink-0 text-cs-subtle"
              aria-label={`${folder.collapsed ? 'Expand' : 'Collapse'} ${folder.name}`}
              onClick={() => props.onToggleFolder(folder.id)}
            >
              {folder.collapsed ? <ChevronRight size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
            </IconButton>
            <button
              className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-sm px-1 text-left outline-none focus-visible:bg-cs-hover"
              type="button"
              title={folder.name}
              onClick={() => props.onSelectFolder(folder.id)}
              onDoubleClick={() => props.onRenameFolder(folder)}
            >
              {folder.collapsed
                ? <Folder className="shrink-0 text-cs-subtle" size={12} strokeWidth={1.7} aria-hidden="true" />
                : <FolderOpen className="shrink-0 text-cs-subtle" size={12} strokeWidth={1.7} aria-hidden="true" />}
              <span className="truncate text-[11px]">{folder.name}</span>
            </button>
            <IconButton
              className="size-6 text-cs-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Actions for ${folder.name}`}
              title="Actions"
              onClick={(event) => openMenuFromButton(event, { kind: 'folder', id: folder.id })}
            >
              <MoreHorizontal size={12} aria-hidden="true" />
            </IconButton>
          </div>
          {!folder.collapsed && renderFolderBranch(folder.id, depth + 1)}
          {!folder.collapsed && activeChats.filter((chat) => chat.folderId === folder.id).map((chat) => chatLeaf(chat, chat.id, depth + 1))}
          {!folder.collapsed && activeNotes.filter((note) => note.folderId === folder.id).map((note) => noteLeaf(note, note.id, depth + 1))}
        </div>
      );
    });
  }

  const rootDropActive = dropTargetId === 'root';
  const contextFolder = contextMenu?.target.kind === 'folder'
    ? props.folders.find((folder) => folder.id === contextMenu.target.id)
    : undefined;
  const contextChat = contextMenu?.target.kind === 'chat'
    ? props.chatRefs.find((chat) => chat.id === contextMenu.target.id)
    : undefined;
  const contextNote = contextMenu?.target.kind === 'note'
    ? props.notes.find((note) => note.id === contextMenu.target.id)
    : undefined;
  const menuLabel = contextFolder?.name ?? contextChat?.label ?? contextNote?.title ?? 'Workspace root';

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-1.5 px-1.5 pt-1.5">
        <SearchField
          aria-label="Search workspace"
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
        <Select
          className="h-8 w-full text-[9px]"
          aria-label="Filter workspace"
          value={filter}
          options={FILTER_OPTIONS}
          onValueChange={(value) => {
            if (FILTER_OPTIONS.some((option) => option.value === value)) {
              setFilter(value as WorkspaceFilter);
              clearSelection();
            }
          }}
        />
      </div>

      {selectedRefs.length > 0 ? (
        <div className="mx-1.5 mt-1.5 flex min-w-0 items-center gap-1 border-y border-cs-border bg-cs-panel px-1.5 py-1">
          <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-cs-muted">{selectedRefs.length} selected</span>
          <Select
            className="h-6 w-24 text-[9px]"
            aria-label="Move selected items"
            value=""
            options={[
              { value: '', label: 'Move…' },
              { value: '__root__', label: 'Root' },
              ...props.folders.map((folder) => ({ value: folder.id, label: folder.name })),
            ]}
            onValueChange={(value) => {
              if (value === '') return;
              props.onBulkMove?.(selectedRefs, value === '__root__' ? null : value);
              clearSelection();
            }}
          />
          {selectedChatCount > 0 && (
            <>
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px]" onClick={() => props.onBulkPin?.(selectedRefs, true)}>Pin</Button>
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px]" onClick={() => props.onBulkPin?.(selectedRefs, false)}>Unpin</Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[9px]"
            onClick={() => {
              props.onBulkArchive?.(selectedRefs, !selectedAreArchived);
              clearSelection();
            }}
          >
            {selectedAreArchived ? <RotateCcw size={9} aria-hidden="true" /> : <Archive size={9} aria-hidden="true" />}
            {selectedAreArchived ? 'Restore' : 'Archive'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[9px] text-cs-danger"
            onClick={() => props.onBulkDelete?.(selectedRefs)}
          >
            <Trash2 size={9} aria-hidden="true" /> Delete
          </Button>
          <IconButton className="size-6 text-cs-subtle" aria-label="Clear selection" title="Clear selection" onClick={clearSelection}>
            <X size={10} aria-hidden="true" />
          </IconButton>
        </div>
      ) : <div />}

      <div className="min-h-0 overflow-y-auto py-1.5">
        {flatMode ? (
          <section>
            <SectionLabel className="px-2.5 py-1.5">{filter === 'all' ? 'Results' : FILTER_OPTIONS.find((option) => option.value === filter)?.label}</SectionLabel>
            {filteredFolders.map((folder) => (
              <div key={folder.id} className="group flex h-7 min-w-0 items-center text-cs-muted hover:bg-cs-hover">
                <button
                  className="flex h-full min-w-0 flex-1 items-center gap-1.5 px-2.5 text-left outline-none hover:text-cs-text focus-visible:bg-cs-hover"
                  type="button"
                  onClick={() => props.onSelectFolder(folder.id)}
                >
                  <Folder size={12} strokeWidth={1.7} aria-hidden="true" />
                  <span className="truncate text-[11px]">{folder.name}</span>
                </button>
              </div>
            ))}
            {filteredChats.map((chat) => chatLeaf(chat, chat.id))}
            {filteredNotes.map((note) => noteLeaf(note, note.id))}
            {filteredFolders.length + filteredChats.length + filteredNotes.length === 0 && (
              <p className="px-2.5 py-3 text-[10px] leading-4 text-cs-subtle">No workspace matches.</p>
            )}
          </section>
        ) : (
          <>
            {pinnedChats.length > 0 && (
              <section className="mb-2">
                <SectionLabel className="px-2.5 py-1.5">Pinned</SectionLabel>
                {pinnedChats.map((chat) => chatLeaf(chat, `pinned-${chat.id}`))}
              </section>
            )}
            <section>
              <div
                className={cn(
                  'group mx-1 mb-0.5 flex h-7 items-center gap-1 rounded-md px-1 text-cs-subtle transition-colors',
                  props.selectedFolderId === null && 'bg-cs-active text-cs-text',
                  rootDropActive && 'bg-cs-active ring-1 ring-inset ring-cs-focus/40',
                )}
                onContextMenu={(event) => openContextMenu(event, { kind: 'root' })}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDropTargetId('root');
                }}
                onDragLeave={() => {
                  if (dropTargetId === 'root') setDropTargetId(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDropTargetId(null);
                  const payload = readDrag(event);
                  if (payload !== null) movePayload(props, payload, null);
                }}
              >
                <button
                  type="button"
                  className="flex h-full min-w-0 flex-1 items-center gap-1 rounded px-1.5 text-left outline-none hover:text-cs-text focus-visible:bg-cs-hover"
                  onClick={() => props.onSelectFolder(null)}
                >
                  <House size={11} strokeWidth={1.7} aria-hidden="true" />
                  <span className="truncate whitespace-nowrap text-[10px] font-medium">Workspace root</span>
                </button>
                {rootDropActive && <span className="shrink-0 text-[8px] font-medium text-cs-muted">Drop here</span>}
                <IconButton
                  className="size-6 text-cs-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="Actions for Workspace root"
                  title="Actions"
                  onClick={(event) => openMenuFromButton(event, { kind: 'root' })}
                >
                  <MoreHorizontal size={12} aria-hidden="true" />
                </IconButton>
              </div>
              {renderFolderBranch(null, 0)}
              {activeChats.filter((chat) => chat.folderId === null).map((chat) => chatLeaf(chat, chat.id))}
              {activeNotes.filter((note) => note.folderId === null).map((note) => noteLeaf(note, note.id))}
              {props.folders.length + activeChats.length + activeNotes.length === 0 && (
                <p className="px-2.5 py-3 text-[10px] leading-4 text-cs-subtle">Save the current chat or create a note.</p>
              )}
            </section>
          </>
        )}
      </div>

      {contextMenu !== null && (
        <DropdownMenu.Root open modal={false} onOpenChange={(open) => { if (!open) setContextMenu(null); }}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="pointer-events-none fixed z-40 size-px opacity-0"
              aria-label={`Actions anchor for ${menuLabel}`}
              style={{ left: contextMenu.x, top: contextMenu.y }}
            />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={2}
              align="start"
              aria-label={`Actions for ${menuLabel}`}
              className="z-50 w-[190px] rounded-lg border border-cs-border bg-cs-surface p-1 shadow-[0_16px_48px_rgba(0,0,0,0.24)]"
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              {contextMenu.target.kind === 'root' && (
                <>
                  <MenuAction icon={<FolderPlus size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onCreateFolder(null))}>New folder</MenuAction>
                  <MenuAction icon={<FilePlus2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onCreateNote(null))}>New note</MenuAction>
                </>
              )}

              {contextFolder !== undefined && (
                <>
                  <MenuAction icon={<FolderPlus size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onCreateFolder(contextFolder.id))}>New subfolder</MenuAction>
                  <MenuAction icon={<FilePlus2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onCreateNote(contextFolder.id))}>New note here</MenuAction>
                  <DropdownMenu.Separator className="my-1 h-px bg-cs-border" />
                  <MenuAction icon={<Pencil size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onRenameFolder(contextFolder))}>Rename folder</MenuAction>
                  <MenuAction danger icon={<Trash2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onDeleteFolder(contextFolder))}>Delete folder</MenuAction>
                </>
              )}

              {contextChat !== undefined && (
                <>
                  <MenuAction icon={<ExternalLink size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onOpenChat(contextChat))}>Open conversation</MenuAction>
                  <MenuAction icon={<Pencil size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onRenameChat(contextChat))}>Rename</MenuAction>
                  <MenuAction icon={<Star size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onTogglePinChat(contextChat))}>{contextChat.pinned ? 'Unpin' : 'Pin'}</MenuAction>
                  <MenuAction
                    icon={contextChat.archivedAt === null ? <Archive size={12} aria-hidden="true" /> : <RotateCcw size={12} aria-hidden="true" />}
                    onClick={() => closeAndRun(() => props.onBulkArchive?.([{ kind: 'chat', id: contextChat.id }], contextChat.archivedAt === null))}
                  >
                    {contextChat.archivedAt === null ? 'Archive' : 'Restore'}
                  </MenuAction>
                  <DropdownMenu.Separator className="my-1 h-px bg-cs-border" />
                  <div className="grid gap-1 px-2 py-1 text-[9px] text-cs-subtle">
                    <span>Move to</span>
                    <Select
                      className="h-7 w-full text-[10px]"
                      aria-label={`Move ${contextChat.label}`}
                      value={contextChat.folderId ?? ''}
                      options={[{ value: '', label: 'Workspace root' }, ...props.folders.map((folder) => ({ value: folder.id, label: folder.name }))]}
                      onValueChange={(value) => closeAndRun(() => props.onMoveChat(contextChat, value === '' ? null : value))}
                    />
                  </div>
                  <DropdownMenu.Separator className="my-1 h-px bg-cs-border" />
                  <MenuAction danger icon={<Trash2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onDeleteChat(contextChat))}>Delete reference</MenuAction>
                </>
              )}

              {contextNote !== undefined && (
                <>
                  <MenuAction icon={<FileText size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onOpenNote(contextNote))}>Edit note</MenuAction>
                  <MenuAction icon={<Pencil size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onRenameNote(contextNote))}>Rename note</MenuAction>
                  <MenuAction
                    icon={contextNote.archivedAt === null ? <Archive size={12} aria-hidden="true" /> : <RotateCcw size={12} aria-hidden="true" />}
                    onClick={() => closeAndRun(() => props.onBulkArchive?.([{ kind: 'note', id: contextNote.id }], contextNote.archivedAt === null))}
                  >
                    {contextNote.archivedAt === null ? 'Archive' : 'Restore'}
                  </MenuAction>
                  <DropdownMenu.Separator className="my-1 h-px bg-cs-border" />
                  <div className="grid gap-1 px-2 py-1 text-[9px] text-cs-subtle">
                    <span>Move to</span>
                    <Select
                      className="h-7 w-full text-[10px]"
                      aria-label={`Move ${contextNote.title}`}
                      value={contextNote.folderId ?? ''}
                      options={[{ value: '', label: 'Workspace root' }, ...props.folders.map((folder) => ({ value: folder.id, label: folder.name }))]}
                      onValueChange={(value) => closeAndRun(() => props.onMoveNote(contextNote, value === '' ? null : value))}
                    />
                  </div>
                  <DropdownMenu.Separator className="my-1 h-px bg-cs-border" />
                  <MenuAction danger icon={<Trash2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onDeleteNote(contextNote))}>Delete note</MenuAction>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}
