import { useMemo, useState } from 'react';

import type { ChatReference, LocalNote, WorkspaceFolder } from '../../domain/workspace/model';

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
}

interface FolderBranchProps extends WorkspaceTreeProps {
  parentId: string | null;
  depth: number;
}

function ChatLeaf({ chat, depth, onOpenChat, onTogglePinChat }: { chat: ChatReference; depth: number; onOpenChat: (chat: ChatReference) => void; onTogglePinChat: (chat: ChatReference) => void }) {
  return (
    <div className="tree-leaf-row" style={{ paddingLeft: `${18 + depth * 14}px` }}>
      <button type="button" className="tree-leaf tree-leaf--button" title={chat.label} onClick={() => onOpenChat(chat)}>
        <span className="tree-kind" aria-hidden="true">↗</span><span>{chat.label}</span>
      </button>
      <button className="tree-secondary-action" type="button" aria-label={`${chat.pinned ? 'Unpin' : 'Pin'} ${chat.label}`} onClick={() => onTogglePinChat(chat)}>
        {chat.pinned ? '★' : '☆'}
      </button>
    </div>
  );
}

function NoteLeaf({ note, depth, onOpenNote }: { note: LocalNote; depth: number; onOpenNote: (note: LocalNote) => void }) {
  return (
    <div className="tree-leaf-row" style={{ paddingLeft: `${18 + depth * 14}px` }}>
      <button type="button" className="tree-leaf tree-leaf--button" title={note.title} onClick={() => onOpenNote(note)}>
        <span className="tree-kind" aria-hidden="true">◇</span><span>{note.title}</span>
      </button>
    </div>
  );
}

function FolderBranch(props: FolderBranchProps) {
  const children = props.folders.filter((folder) => folder.parentId === props.parentId);
  return (
    <>
      {children.map((folder) => (
        <div key={folder.id}>
          <div className="tree-folder-row" data-active={props.selectedFolderId === folder.id ? 'true' : 'false'} style={{ paddingLeft: `${6 + props.depth * 14}px` }}>
            <button className="tree-disclosure" type="button" aria-label={`${folder.collapsed ? 'Expand' : 'Collapse'} ${folder.name}`} onClick={() => props.onToggleFolder(folder.id)}>
              {folder.collapsed ? '›' : '⌄'}
            </button>
            <button className="tree-row" type="button" title={folder.name} onClick={() => props.onSelectFolder(folder.id)} onDoubleClick={() => props.onRenameFolder(folder)}>
              <span aria-hidden="true">▱</span><span>{folder.name}</span>
            </button>
          </div>
          {!folder.collapsed && <FolderBranch {...props} parentId={folder.id} depth={props.depth + 1} />}
          {!folder.collapsed && props.chatRefs.filter((chat) => chat.folderId === folder.id).map((chat) => <ChatLeaf key={chat.id} chat={chat} depth={props.depth + 1} onOpenChat={props.onOpenChat} onTogglePinChat={props.onTogglePinChat} />)}
          {!folder.collapsed && props.notes.filter((note) => note.folderId === folder.id).map((note) => <NoteLeaf key={note.id} note={note} depth={props.depth + 1} onOpenNote={props.onOpenNote} />)}
        </div>
      ))}
    </>
  );
}

export function WorkspaceTree(props: WorkspaceTreeProps) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const selectedFolder = props.folders.find((folder) => folder.id === props.selectedFolderId);
  const pinnedChats = props.chatRefs.filter((chat) => chat.pinned);
  const searchResults = useMemo(() => {
    if (normalized === '') return null;
    return {
      folders: props.folders.filter((folder) => folder.name.toLowerCase().includes(normalized)),
      chats: props.chatRefs.filter((chat) => chat.label.toLowerCase().includes(normalized)),
      notes: props.notes.filter((note) => note.title.toLowerCase().includes(normalized)),
    };
  }, [normalized, props.chatRefs, props.folders, props.notes]);

  return (
    <div className="workspace-explorer">
      <div className="explorer-search-wrap">
        <span aria-hidden="true">⌕</span>
        <input aria-label="Search workspace" placeholder="Search workspace" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <div className="workspace-tree-content">
        {searchResults !== null ? (
          <section className="tree-section">
            <div className="tree-section-heading">Results</div>
            {searchResults.folders.map((folder) => <button key={folder.id} className="tree-row tree-search-result" type="button" onClick={() => props.onSelectFolder(folder.id)}>▱ <span>{folder.name}</span></button>)}
            {searchResults.chats.map((chat) => <ChatLeaf key={chat.id} chat={chat} depth={0} onOpenChat={props.onOpenChat} onTogglePinChat={props.onTogglePinChat} />)}
            {searchResults.notes.map((note) => <NoteLeaf key={note.id} note={note} depth={0} onOpenNote={props.onOpenNote} />)}
            {searchResults.folders.length + searchResults.chats.length + searchResults.notes.length === 0 && <p className="panel-empty">No workspace matches.</p>}
          </section>
        ) : (
          <>
            {pinnedChats.length > 0 && (
              <section className="tree-section">
                <div className="tree-section-heading">Pinned</div>
                {pinnedChats.map((chat) => <ChatLeaf key={`pinned-${chat.id}`} chat={chat} depth={0} onOpenChat={props.onOpenChat} onTogglePinChat={props.onTogglePinChat} />)}
              </section>
            )}
            <section className="tree-section">
              <div className="tree-section-heading">Workspace</div>
              <FolderBranch {...props} parentId={null} depth={0} />
              {props.chatRefs.filter((chat) => chat.folderId === null).map((chat) => <ChatLeaf key={chat.id} chat={chat} depth={0} onOpenChat={props.onOpenChat} onTogglePinChat={props.onTogglePinChat} />)}
              {props.notes.filter((note) => note.folderId === null).map((note) => <NoteLeaf key={note.id} note={note} depth={0} onOpenNote={props.onOpenNote} />)}
              {props.folders.length + props.chatRefs.length + props.notes.length === 0 && <p className="panel-empty">Save the current chat or create a note.</p>}
            </section>
          </>
        )}
      </div>

      {selectedFolder !== undefined && (
        <div className="explorer-selection-actions" aria-label={`Folder actions for ${selectedFolder.name}`}>
          <span>{selectedFolder.name}</span>
          <button type="button" onClick={() => props.onRenameFolder(selectedFolder)}>Rename</button>
          <button type="button" onClick={() => props.onDeleteFolder(selectedFolder)}>Delete</button>
        </div>
      )}
    </div>
  );
}
