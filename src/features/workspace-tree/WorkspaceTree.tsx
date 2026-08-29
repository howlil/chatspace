import {
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
  Pin,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState, type DragEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

import type { ChatReference, LocalNote, WorkspaceFolder } from '../../domain/workspace/model';
import { cn } from '../../ui/cn';
import { IconButton, SectionLabel, Select } from '../../ui/primitives';

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
  const viewportHeight = typeof window === 'undefined' ? y + 240 : window.innerHeight;
  return {
    x: Math.max(8, Math.min(x, viewportWidth - CONTEXT_MENU_WIDTH - 8)),
    y: Math.max(8, Math.min(y, viewportHeight - 240)),
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
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded px-2 text-left text-[10px] outline-none hover:bg-cs-hover focus-visible:bg-cs-hover',
        danger ? 'text-cs-danger' : 'text-cs-muted hover:text-cs-text focus-visible:text-cs-text',
      )}
      onClick={onClick}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

interface LeafMenuProps {
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
  onMenuButtonClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

function ChatLeaf({
  chat,
  depth,
  onOpenChat,
  onTogglePinChat,
  onContextMenu,
  onMenuButtonClick,
}: {
  chat: ChatReference;
  depth: number;
  onOpenChat: (chat: ChatReference) => void;
  onTogglePinChat: (chat: ChatReference) => void;
} & LeafMenuProps) {
  return (
    <div
      className="group flex h-7 w-full min-w-0 items-center pr-1 text-cs-muted hover:bg-cs-hover"
      style={{ paddingLeft: `${8 + depth * 14}px` }}
      draggable
      onContextMenu={onContextMenu}
      onDragStart={(event) => startDrag(event, { kind: 'chat', id: chat.id })}
    >
      <button
        type="button"
        className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-sm px-1.5 text-left outline-none transition-colors hover:text-cs-text focus-visible:bg-cs-hover focus-visible:text-cs-text"
        title={chat.label}
        onClick={() => onOpenChat(chat)}
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

function NoteLeaf({
  note,
  depth,
  onOpenNote,
  onContextMenu,
  onMenuButtonClick,
}: {
  note: LocalNote;
  depth: number;
  onOpenNote: (note: LocalNote) => void;
} & LeafMenuProps) {
  return (
    <div
      className="group flex h-7 w-full min-w-0 items-center pr-1 text-cs-muted hover:bg-cs-hover"
      style={{ paddingLeft: `${8 + depth * 14}px` }}
      draggable
      onContextMenu={onContextMenu}
      onDragStart={(event) => startDrag(event, { kind: 'note', id: note.id })}
    >
      <button
        type="button"
        className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-sm px-1.5 text-left outline-none transition-colors hover:text-cs-text focus-visible:bg-cs-hover focus-visible:text-cs-text"
        title={note.title}
        onClick={() => onOpenNote(note)}
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

export function WorkspaceTree(props: WorkspaceTreeProps) {
  const [query, setQuery] = useState('');
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<TreeContextMenuState | null>(null);
  const normalized = query.trim().toLowerCase();
  const pinnedChats = props.chatRefs.filter((chat) => chat.pinned);
  const searchResults = useMemo(() => {
    if (normalized === '') return null;
    return {
      folders: props.folders.filter((folder) => folder.name.toLowerCase().includes(normalized)),
      chats: props.chatRefs.filter((chat) => chat.label.toLowerCase().includes(normalized)),
      notes: props.notes.filter((note) => note.title.toLowerCase().includes(normalized)),
    };
  }, [normalized, props.chatRefs, props.folders, props.notes]);

  useEffect(() => {
    if (contextMenu === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [contextMenu]);

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

  const chatLeaf = (chat: ChatReference, key: string, depth = 0) => (
    <ChatLeaf
      key={key}
      chat={chat}
      depth={depth}
      onOpenChat={props.onOpenChat}
      onTogglePinChat={props.onTogglePinChat}
      onContextMenu={(event) => openContextMenu(event, { kind: 'chat', id: chat.id })}
      onMenuButtonClick={(event) => openMenuFromButton(event, { kind: 'chat', id: chat.id })}
    />
  );

  const noteLeaf = (note: LocalNote, key: string, depth = 0) => (
    <NoteLeaf
      key={key}
      note={note}
      depth={depth}
      onOpenNote={props.onOpenNote}
      onContextMenu={(event) => openContextMenu(event, { kind: 'note', id: note.id })}
      onMenuButtonClick={(event) => openMenuFromButton(event, { kind: 'note', id: note.id })}
    />
  );

  function renderFolderBranch(parentId: string | null, depth: number): ReactNode {
    const children = props.folders.filter((folder) => folder.parentId === parentId);
    return children.map((folder) => {
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
              {folder.collapsed ? (
                <Folder className="shrink-0 text-cs-subtle" size={12} strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <FolderOpen className="shrink-0 text-cs-subtle" size={12} strokeWidth={1.7} aria-hidden="true" />
              )}
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
          {!folder.collapsed && props.chatRefs.filter((chat) => chat.folderId === folder.id).map((chat) => chatLeaf(chat, chat.id, depth + 1))}
          {!folder.collapsed && props.notes.filter((note) => note.folderId === folder.id).map((note) => noteLeaf(note, note.id, depth + 1))}
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
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
      <div className="relative mx-1.5 mt-1.5">
        <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-cs-subtle" size={11} aria-hidden="true" />
        <input
          className="h-7 w-full rounded-md border border-cs-border bg-cs-control pl-6 pr-2 text-[11px] text-cs-text outline-none placeholder:text-cs-subtle focus:border-cs-focus focus:ring-1 focus:ring-cs-focus/20"
          aria-label="Search workspace"
          placeholder="Search workspace"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="min-h-0 overflow-y-auto py-1.5">
        {searchResults !== null ? (
          <section>
            <SectionLabel className="px-2.5 py-1.5">Results</SectionLabel>
            {searchResults.folders.map((folder) => (
              <div
                key={folder.id}
                className="group flex h-7 min-w-0 items-center text-cs-muted hover:bg-cs-hover"
                onContextMenu={(event) => openContextMenu(event, { kind: 'folder', id: folder.id })}
              >
                <button
                  className="flex h-full min-w-0 flex-1 items-center gap-1.5 px-2.5 text-left outline-none hover:text-cs-text focus-visible:bg-cs-hover"
                  type="button"
                  onClick={() => props.onSelectFolder(folder.id)}
                >
                  <Folder size={12} strokeWidth={1.7} aria-hidden="true" />
                  <span className="truncate text-[11px]">{folder.name}</span>
                </button>
                <IconButton
                  className="mr-1 size-6 text-cs-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label={`Actions for ${folder.name}`}
                  title="Actions"
                  onClick={(event) => openMenuFromButton(event, { kind: 'folder', id: folder.id })}
                >
                  <MoreHorizontal size={12} aria-hidden="true" />
                </IconButton>
              </div>
            ))}
            {searchResults.chats.map((chat) => chatLeaf(chat, chat.id))}
            {searchResults.notes.map((note) => noteLeaf(note, note.id))}
            {searchResults.folders.length + searchResults.chats.length + searchResults.notes.length === 0 && (
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
              {props.chatRefs.filter((chat) => chat.folderId === null).map((chat) => chatLeaf(chat, chat.id))}
              {props.notes.filter((note) => note.folderId === null).map((note) => noteLeaf(note, note.id))}
              {props.folders.length + props.chatRefs.length + props.notes.length === 0 && (
                <p className="px-2.5 py-3 text-[10px] leading-4 text-cs-subtle">Save the current chat or create a note.</p>
              )}
            </section>
          </>
        )}
      </div>

      {contextMenu !== null && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close workspace actions"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 w-[190px] rounded-lg border border-cs-border bg-cs-surface p-1 shadow-[0_16px_48px_rgba(0,0,0,0.24)]"
            role="menu"
            aria-label={`Actions for ${menuLabel}`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.target.kind === 'root' && (
              <>
                <MenuAction icon={<FolderPlus size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onCreateFolder(null))}>
                  New folder
                </MenuAction>
                <MenuAction icon={<FilePlus2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onCreateNote(null))}>
                  New note
                </MenuAction>
              </>
            )}

            {contextFolder !== undefined && (
              <>
                <MenuAction icon={<FolderPlus size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onCreateFolder(contextFolder.id))}>
                  New subfolder
                </MenuAction>
                <MenuAction icon={<FilePlus2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onCreateNote(contextFolder.id))}>
                  New note here
                </MenuAction>
                <div className="my-1 border-t border-cs-border" />
                <MenuAction icon={<Pencil size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onRenameFolder(contextFolder))}>
                  Rename folder
                </MenuAction>
                <MenuAction danger icon={<Trash2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onDeleteFolder(contextFolder))}>
                  Delete folder
                </MenuAction>
              </>
            )}

            {contextChat !== undefined && (
              <>
                <MenuAction icon={<ExternalLink size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onOpenChat(contextChat))}>
                  Open conversation
                </MenuAction>
                <MenuAction icon={<Pencil size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onRenameChat(contextChat))}>
                  Rename
                </MenuAction>
                <MenuAction icon={<Pin size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onTogglePinChat(contextChat))}>
                  {contextChat.pinned ? 'Unpin' : 'Pin'}
                </MenuAction>
                <div className="my-1 border-t border-cs-border" />
                <label className="grid gap-1 px-2 py-1 text-[9px] text-cs-subtle">
                  Move to
                  <Select
                    className="h-7 w-full text-[10px]"
                    aria-label={`Move ${contextChat.label}`}
                    value={contextChat.folderId ?? ''}
                    onChange={(event) => {
                      const folderId = event.target.value === '' ? null : event.target.value;
                      closeAndRun(() => props.onMoveChat(contextChat, folderId));
                    }}
                  >
                    <option value="">Workspace root</option>
                    {props.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                  </Select>
                </label>
                <div className="my-1 border-t border-cs-border" />
                <MenuAction danger icon={<Trash2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onDeleteChat(contextChat))}>
                  Delete reference
                </MenuAction>
              </>
            )}

            {contextNote !== undefined && (
              <>
                <MenuAction icon={<FileText size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onOpenNote(contextNote))}>
                  Edit note
                </MenuAction>
                <MenuAction icon={<Pencil size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onRenameNote(contextNote))}>
                  Rename note
                </MenuAction>
                <div className="my-1 border-t border-cs-border" />
                <label className="grid gap-1 px-2 py-1 text-[9px] text-cs-subtle">
                  Move to
                  <Select
                    className="h-7 w-full text-[10px]"
                    aria-label={`Move ${contextNote.title}`}
                    value={contextNote.folderId ?? ''}
                    onChange={(event) => {
                      const folderId = event.target.value === '' ? null : event.target.value;
                      closeAndRun(() => props.onMoveNote(contextNote, folderId));
                    }}
                  >
                    <option value="">Workspace root</option>
                    {props.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                  </Select>
                </label>
                <div className="my-1 border-t border-cs-border" />
                <MenuAction danger icon={<Trash2 size={12} aria-hidden="true" />} onClick={() => closeAndRun(() => props.onDeleteNote(contextNote))}>
                  Delete note
                </MenuAction>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
