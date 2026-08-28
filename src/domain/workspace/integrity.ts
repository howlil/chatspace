import type { WorkspaceFolder, WorkspaceSnapshot } from './model';

function hasUniqueFolderIds(folders: WorkspaceFolder[]): boolean {
  return new Set(folders.map((folder) => folder.id)).size === folders.length;
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
  if (!hasUniqueFolderIds(folders)) return false;

  return folders.every((folder) => {
    if (folder.parentId === null) return true;
    return canMoveFolder(folders, folder.id, folder.parentId);
  });
}

export function hasValidWorkspaceSemantics(snapshot: WorkspaceSnapshot): boolean {
  if (!hasValidFolderHierarchy(snapshot.folders)) return false;

  const folderIds = new Set(snapshot.folders.map((folder) => folder.id));
  const ownsValidFolder = (folderId: string | null) => folderId === null || folderIds.has(folderId);

  return (
    snapshot.chatRefs.every((chat) => ownsValidFolder(chat.folderId)) &&
    snapshot.notes.every((note) => ownsValidFolder(note.folderId))
  );
}
