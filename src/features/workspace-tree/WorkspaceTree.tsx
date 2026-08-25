import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Pin,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import type { ChatReference, LocalNote, WorkspaceFolder } from '../../domain/workspace/model';
import { cn } from '../../ui/cn';
import { Button, IconButton, SectionLabel, Select } from '../../ui/primitives';

interface WorkspaceTreeProps {
  folders: WorkspaceFolder[];
  chatRefs: ChatReference[];
  notes: LocalNote[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onToggleFolder: (folderId: string) => void;
  onRenameFolder: (folder: WorkspaceFolder) => void;
  onDeleteFolder: (folder: WorkspaceFolder) => void;
  onOpenChat: (chat: ChatReference) => void;
  onOpenNote: (note: LocalNote) => void;
  onTogglePinChat: (chat: ChatReference) => void;
  onRenameChat: (chat: ChatReference) => void;
  onDeleteChat: (chat: ChatReference) => void;
  onMoveChat: (chat: ChatReference, folderId: string | null) => void;
}

interface FolderBranchProps extends WorkspaceTreeProps {
  parentId: string | null;
  depth: number;
  onManageChat: (chat: ChatReference) => void;
}

function ChatLeaf({
  chat,
  depth,
  onOpenChat,
  onTogglePinChat,
  onManageChat,
}: {
  chat: ChatReference;
  depth: number;
  onOpenChat: (chat: ChatReference) => void;
  onTogglePinChat: (chat: ChatReference) => void;
  onManageChat: (chat: ChatReference) => void;
}) {
  return (
    <div
      className="group flex h-7 w-full min-w-0 items-center pr-1 text-cs-muted hover:bg-white/[0.045]"
      style={{ paddingLeft: `${8 + depth * 14}px` }}
    >
      <button
        type="button"
        className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-sm px-1.5 text-left outline-none transition-colors hover:text-cs-text focus-visible:bg-white/[0.055] focus-visible:text-cs-text"
        title={chat.label}
        onClick={() => onOpenChat(chat)}
      >
        <span className="grid size-4 shrink-0 place-items-center text-cs-subtle" aria-hidden="true">
          <span className="text-[11px] leading-none">↗</span>
        </span>
        <span className="truncate text-[11px]">{chat.label}</span>
      </button>
      <IconButton
        className={cn(
          'size-6 text-cs-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          chat.pinned && 'text-cs-muted opacity-100',
        )}
        aria-label={`${chat.pinned ? 'Unpin' : 'Pin'} ${chat.label}`}
        onClick={() => onTogglePinChat(chat)}
      >
        <Star size={11} fill={chat.pinned ? 'currentColor' : 'none'} aria-hidden="true" />
      </IconButton>
      <IconButton
        className="size-6 text-cs-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Manage ${chat.label}`}
        onClick={() => onManageChat(chat)}
      >
        <MoreHorizontal size={12} aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function NoteLeaf({ note, depth, onOpenNote }: { note: LocalNote; depth: number; onOpenNote: (note: LocalNote) => void }) {
  return (
    <button
      type="button"
      className="flex h-7 w-full min-w-0 items-center gap-1.5 overflow-hidden pr-2 text-left text-cs-muted outline-none transition-colors hover:bg-white/[0.045] hover:text-cs-text focus-visible:bg-white/[0.055] focus-visible:text-cs-text"
      style={{ paddingLeft: `${10 + depth * 14}px` }}
      title={note.title}
      onClick={() => onOpenNote(note)}
    >
      <FileText className="shrink-0 text-cs-subtle" size={12} strokeWidth={1.7} aria-hidden="true" />
      <span className="truncate text-[11px]">{note.title}</span>
    </button>
  );
}

function FolderBranch(props: FolderBranchProps) {
  const children = props.folders.filter((folder) => folder.parentId === props.parentId);

  return (
    <>
      {children.map((folder) => {
        const active = props.selectedFolderId === folder.id;
        return (
          <div key={folder.id}>
            <div
              className={cn(
                'group flex h-7 min-w-0 items-center pr-1 transition-colors hover:bg-white/[0.045]',
                active && 'bg-white/[0.065] text-cs-text',
              )}
              style={{ paddingLeft: `${4 + props.depth * 14}px` }}
            >
              <IconButton
                className="size-5 shrink-0 text-cs-subtle"
                aria-label={`${folder.collapsed ? 'Expand' : 'Collapse'} ${folder.name}`}
                onClick={() => props.onToggleFolder(folder.id)}
              >
                {folder.collapsed ? <ChevronRight size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
              </IconButton>
              <button
                className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-sm px-1 text-left outline-none focus-visible:bg-white/[0.055]"
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
            </div>

            {!folder.collapsed && <FolderBranch {...props} parentId={folder.id} depth={props.depth + 1} />}
            {!folder.collapsed &&
              props.chatRefs
                .filter((chat) => chat.folderId === folder.id)
                .map((chat) => (
                  <ChatLeaf
                    key={chat.id}
                    chat={chat}
                    depth={props.depth + 1}
                    onOpenChat={props.onOpenChat}
                    onTogglePinChat={props.onTogglePinChat}
                    onManageChat={props.onManageChat}
                  />
                ))}
            {!folder.collapsed &&
              props.notes
                .filter((note) => note.folderId === folder.id)
                .map((note) => <NoteLeaf key={note.id} note={note} depth={props.depth + 1} onOpenNote={props.onOpenNote} />)}
          </div>
        );
      })}
    </>
  );
}

export function WorkspaceTree(props: WorkspaceTreeProps) {
  const [query, setQuery] = useState('');
  const [managedChatId, setManagedChatId] = useState<string | null>(null);
  const normalized = query.trim().toLowerCase();
  const selectedFolder = props.folders.find((folder) => folder.id === props.selectedFolderId);
  const managedChat = props.chatRefs.find((chat) => chat.id === managedChatId);
  const pinnedChats = props.chatRefs.filter((chat) => chat.pinned);
  const searchResults = useMemo(() => {
    if (normalized === '') return null;
    return {
      folders: props.folders.filter((folder) => folder.name.toLowerCase().includes(normalized)),
      chats: props.chatRefs.filter((chat) => chat.label.toLowerCase().includes(normalized)),
      notes: props.notes.filter((note) => note.title.toLowerCase().includes(normalized)),
    };
  }, [normalized, props.chatRefs, props.folders, props.notes]);

  const chatLeaf = (chat: ChatReference, key: string, depth = 0) => (
    <ChatLeaf
      key={key}
      chat={chat}
      depth={depth}
      onOpenChat={props.onOpenChat}
      onTogglePinChat={props.onTogglePinChat}
      onManageChat={(item) => setManagedChatId(item.id)}
    />
  );

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
      <div className="relative mx-2 mt-2">
        <Search
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-cs-subtle"
          size={12}
          aria-hidden="true"
        />
        <input
          className="h-7 w-full rounded-md border border-white/[0.085] bg-cs-bg pl-7 pr-2 text-[11px] text-cs-text outline-none placeholder:text-cs-subtle focus:border-white/20 focus:ring-1 focus:ring-white/15"
          aria-label="Search workspace"
          placeholder="Search workspace"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="min-h-0 overflow-y-auto py-2">
        {searchResults !== null ? (
          <section>
            <SectionLabel className="px-2.5 py-1.5">Results</SectionLabel>
            {searchResults.folders.map((folder) => (
              <button
                key={folder.id}
                className="flex h-7 w-full min-w-0 items-center gap-1.5 px-2.5 text-left text-cs-muted outline-none hover:bg-white/[0.045] hover:text-cs-text focus-visible:bg-white/[0.055]"
                type="button"
                onClick={() => props.onSelectFolder(folder.id)}
              >
                <Folder size={12} strokeWidth={1.7} aria-hidden="true" />
                <span className="truncate text-[11px]">{folder.name}</span>
              </button>
            ))}
            {searchResults.chats.map((chat) => chatLeaf(chat, chat.id))}
            {searchResults.notes.map((note) => <NoteLeaf key={note.id} note={note} depth={0} onOpenNote={props.onOpenNote} />)}
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
              <SectionLabel className="px-2.5 py-1.5">Workspace</SectionLabel>
              <FolderBranch {...props} parentId={null} depth={0} onManageChat={(chat) => setManagedChatId(chat.id)} />
              {props.chatRefs.filter((chat) => chat.folderId === null).map((chat) => chatLeaf(chat, chat.id))}
              {props.notes
                .filter((note) => note.folderId === null)
                .map((note) => <NoteLeaf key={note.id} note={note} depth={0} onOpenNote={props.onOpenNote} />)}
              {props.folders.length + props.chatRefs.length + props.notes.length === 0 && (
                <p className="px-2.5 py-3 text-[10px] leading-4 text-cs-subtle">Save the current chat or create a note.</p>
              )}
            </section>
          </>
        )}
      </div>

      {managedChat !== undefined ? (
        <div className="border-t border-white/[0.07] bg-cs-surface/80 p-2" aria-label={`Conversation actions for ${managedChat.label}`}>
          <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <SectionLabel>Conversation</SectionLabel>
              <strong className="mt-1 block truncate text-[11px] font-medium" title={managedChat.label}>{managedChat.label}</strong>
            </div>
            <IconButton className="-mr-1 -mt-1 text-cs-subtle" aria-label="Close conversation actions" onClick={() => setManagedChatId(null)}>
              <X size={12} aria-hidden="true" />
            </IconButton>
          </div>
          <Select
            className="mb-2 w-full"
            aria-label={`Move ${managedChat.label}`}
            value={managedChat.folderId ?? ''}
            onChange={(event) => props.onMoveChat(managedChat, event.target.value === '' ? null : event.target.value)}
          >
            <option value="">Workspace root</option>
            {props.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </Select>
          <div className="grid grid-cols-3 gap-1">
            <Button variant="ghost" className="px-1" onClick={() => props.onRenameChat(managedChat)}>
              <Pencil size={11} aria-hidden="true" /> Rename
            </Button>
            <Button variant="ghost" className="px-1" onClick={() => props.onTogglePinChat(managedChat)}>
              <Pin size={11} aria-hidden="true" /> {managedChat.pinned ? 'Unpin' : 'Pin'}
            </Button>
            <Button variant="danger" className="px-1" onClick={() => { props.onDeleteChat(managedChat); setManagedChatId(null); }}>
              <Trash2 size={11} aria-hidden="true" /> Delete
            </Button>
          </div>
        </div>
      ) : selectedFolder !== undefined ? (
        <div className="flex min-w-0 items-center gap-1 border-t border-white/[0.07] bg-cs-surface/80 p-2" aria-label={`Folder actions for ${selectedFolder.name}`}>
          <span className="min-w-0 flex-1 truncate text-[10px] text-cs-muted">{selectedFolder.name}</span>
          <IconButton aria-label={`Rename ${selectedFolder.name}`} onClick={() => props.onRenameFolder(selectedFolder)}>
            <Pencil size={11} aria-hidden="true" />
          </IconButton>
          <IconButton className="text-red-200/80" aria-label={`Delete ${selectedFolder.name}`} onClick={() => props.onDeleteFolder(selectedFolder)}>
            <Trash2 size={11} aria-hidden="true" />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}
