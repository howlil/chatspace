import type { WorkspaceFolder, WorkspaceSnapshot, WorkspaceTab } from './model';

function hasUniqueIds(items: ReadonlyArray<{ id: string }>): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function entityExists(snapshot: WorkspaceSnapshot, entityId: string): boolean {
  return (
    snapshot.folders.some((folder) => folder.id === entityId) ||
    snapshot.chatRefs.some((chat) => chat.id === entityId) ||
    snapshot.notes.some((note) => note.id === entityId)
  );
}

function tabHasValidEntity(snapshot: WorkspaceSnapshot, tab: WorkspaceTab): boolean {
  if (tab.kind === 'chat') {
    return tab.entityId !== null && snapshot.chatRefs.some((chat) => chat.id === tab.entityId);
  }
  if (tab.kind === 'note') {
    return tab.entityId !== null && snapshot.notes.some((note) => note.id === tab.entityId);
  }
  return tab.entityId === null;
}

export function canMoveFolder(
  folders: WorkspaceFolder[],
  folderId: string,
  candidateParentId: string | null,
): boolean {
  if (!folders.some((folder) => folder.id === folderId)) return false;
  if (candidateParentId === null) return true;
  if (candidateParentId === folderId) return false;

  let cursor: string | null = candidateParentId;
  const visited = new Set<string>();

  while (cursor !== null) {
    if (cursor === folderId || visited.has(cursor)) return false;
    visited.add(cursor);

    const folder = folders.find((item) => item.id === cursor);
    if (folder === undefined) return false;
    cursor = folder.parentId;
  }

  return true;
}

export function hasValidFolderHierarchy(folders: WorkspaceFolder[]): boolean {
  if (!hasUniqueIds(folders)) return false;

  return folders.every((folder) => {
    if (folder.parentId === null) return true;
    return canMoveFolder(folders, folder.id, folder.parentId);
  });
}

export function hasValidWorkspaceSemantics(snapshot: WorkspaceSnapshot): boolean {
  if (!hasValidFolderHierarchy(snapshot.folders)) return false;
  if (!hasUniqueIds(snapshot.chatRefs) || !hasUniqueIds(snapshot.notes)) return false;
  if (!hasUniqueIds(snapshot.manualEdges) || !hasUniqueIds(snapshot.tabs)) return false;

  const entityIds = [
    ...snapshot.folders.map((folder) => folder.id),
    ...snapshot.chatRefs.map((chat) => chat.id),
    ...snapshot.notes.map((note) => note.id),
  ];
  if (new Set(entityIds).size !== entityIds.length) return false;

  const folderIds = new Set(snapshot.folders.map((folder) => folder.id));
  const chatIds = new Set(snapshot.chatRefs.map((chat) => chat.id));

  if (snapshot.chatRefs.some((chat) => chat.folderId !== null && !folderIds.has(chat.folderId))) return false;
  if (snapshot.notes.some((note) => note.folderId !== null && !folderIds.has(note.folderId))) return false;
  if (snapshot.notes.some((note) => note.linkedChatIds.some((chatId) => !chatIds.has(chatId)))) return false;

  if (snapshot.manualEdges.some((edge) => (
    edge.sourceEntityId === edge.targetEntityId ||
    !entityExists(snapshot, edge.sourceEntityId) ||
    !entityExists(snapshot, edge.targetEntityId)
  ))) return false;

  if (snapshot.tabs.some((tab) => !tabHasValidEntity(snapshot, tab))) return false;
  if (!snapshot.tabs.some((tab) => tab.id === snapshot.activeTabId)) return false;

  return true;
}
