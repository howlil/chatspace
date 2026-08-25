import type { ChatReference, LocalNote, WorkspaceFolder } from '../../domain/workspace/model';

interface WorkspaceTreeProps {
  folders: WorkspaceFolder[];
  chatRefs: ChatReference[];
  notes: LocalNote[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onOpenChat: (chat: ChatReference) => void;
}

interface FolderBranchProps extends WorkspaceTreeProps {
  parentId: string | null;
  depth: number;
}

function ChatLeaf({ chat, depth, onOpenChat }: { chat: ChatReference; depth: number; onOpenChat: (chat: ChatReference) => void }) {
  return (
    <button
      type="button"
      className="tree-leaf tree-leaf--button"
      style={{ paddingLeft: `${28 + depth * 14}px` }}
      title={chat.label}
      onClick={() => onOpenChat(chat)}
    >
      <span aria-hidden="true">↗</span>
      <span>{chat.label}</span>
    </button>
  );
}

function FolderBranch(props: FolderBranchProps) {
  const children = props.folders.filter((folder) => folder.parentId === props.parentId);

  return (
    <>
      {children.map((folder) => (
        <div key={folder.id}>
          <button
            className="tree-row"
            data-active={props.selectedFolderId === folder.id ? 'true' : 'false'}
            type="button"
            style={{ paddingLeft: `${10 + props.depth * 14}px` }}
            onClick={() => props.onSelectFolder(folder.id)}
          >
            <span aria-hidden="true">▸</span>
            <span>{folder.name}</span>
          </button>
          {!folder.collapsed && (
            <FolderBranch {...props} parentId={folder.id} depth={props.depth + 1} />
          )}
          {!folder.collapsed &&
            props.chatRefs
              .filter((chat) => chat.folderId === folder.id)
              .map((chat) => (
                <ChatLeaf key={chat.id} chat={chat} depth={props.depth} onOpenChat={props.onOpenChat} />
              ))}
          {!folder.collapsed &&
            props.notes
              .filter((note) => note.folderId === folder.id)
              .map((note) => (
                <div
                  key={note.id}
                  className="tree-leaf"
                  style={{ paddingLeft: `${28 + props.depth * 14}px` }}
                >
                  <span aria-hidden="true">·</span>
                  <span title={note.title}>{note.title}</span>
                </div>
              ))}
        </div>
      ))}
    </>
  );
}

export function WorkspaceTree(props: WorkspaceTreeProps) {
  const rootChats = props.chatRefs.filter((chat) => chat.folderId === null);
  const rootNotes = props.notes.filter((note) => note.folderId === null);

  return (
    <div className="workspace-tree-content">
      <button
        className="tree-row"
        data-active={props.selectedFolderId === null ? 'true' : 'false'}
        type="button"
        onClick={() => props.onSelectFolder(null)}
      >
        <span aria-hidden="true">⌂</span>
        <span>Workspace root</span>
      </button>
      <FolderBranch {...props} parentId={null} depth={0} />
      {rootChats.map((chat) => (
        <ChatLeaf key={chat.id} chat={chat} depth={0} onOpenChat={props.onOpenChat} />
      ))}
      {rootNotes.map((note) => (
        <div key={note.id} className="tree-leaf">
          <span aria-hidden="true">·</span>
          <span title={note.title}>{note.title}</span>
        </div>
      ))}
    </div>
  );
}
