import type { ChatReference, LocalNote, WorkspaceFolder } from './model';

export type WorkspaceArtifactKind = 'chat' | 'note';
export type WorkspaceArtifactRef = { kind: WorkspaceArtifactKind; id: string };
export type WorkspaceFilter = 'all' | 'notes' | 'chats' | 'pinned' | 'unfiled' | 'archived';

export interface WorkspaceRetrievalItem {
  id: string;
  kind: 'folder' | WorkspaceArtifactKind | 'view' | 'command';
  label: string;
  searchText: string;
  run: () => void;
}

export function artifactKey(ref: WorkspaceArtifactRef): string {
  return `${ref.kind}:${ref.id}`;
}

export function parseArtifactKey(key: string): WorkspaceArtifactRef | null {
  const separator = key.indexOf(':');
  if (separator <= 0) return null;
  const kind = key.slice(0, separator);
  const id = key.slice(separator + 1);
  if ((kind !== 'chat' && kind !== 'note') || id === '') return null;
  return { kind, id };
}

export function artifactMatchesFilter(
  artifact: ChatReference | LocalNote,
  kind: WorkspaceArtifactKind,
  filter: WorkspaceFilter,
): boolean {
  if (filter === 'archived') return artifact.archivedAt !== null;
  if (artifact.archivedAt !== null) return false;
  if (filter === 'all') return true;
  if (filter === 'notes') return kind === 'note';
  if (filter === 'chats') return kind === 'chat';
  if (filter === 'pinned') return kind === 'chat' && (artifact as ChatReference).pinned;
  return artifact.folderId === null;
}

function normalizedText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function matchesWorkspaceQuery(
  artifact: ChatReference | LocalNote,
  kind: WorkspaceArtifactKind,
  query: string,
): boolean {
  const normalized = normalizedText(query);
  if (normalized === '') return true;
  if (kind === 'chat') return (artifact as ChatReference).label.toLocaleLowerCase().includes(normalized);
  const note = artifact as LocalNote;
  const properties = Object.entries(note.properties).map(([key, value]) => `${key} ${JSON.stringify(value)}`).join(' ');
  return `${note.title}\n${note.tags.join(' ')}\n${properties}\n${note.content}`.toLocaleLowerCase().includes(normalized);
}

export function folderMatchesQuery(folder: WorkspaceFolder, query: string): boolean {
  const normalized = normalizedText(query);
  return normalized === '' || folder.name.toLocaleLowerCase().includes(normalized);
}

function scoreItem(item: WorkspaceRetrievalItem, query: string): number {
  const normalized = normalizedText(query);
  if (normalized === '') return item.kind === 'command' ? 4 : 0;
  const label = item.label.toLocaleLowerCase();
  const searchText = item.searchText.toLocaleLowerCase();
  if (label === normalized) return 0;
  if (label.startsWith(normalized)) return 1;
  if (label.includes(normalized)) return 2;
  if (searchText.includes(normalized)) return 3;
  return Number.POSITIVE_INFINITY;
}

export function rankRetrievalItems(items: WorkspaceRetrievalItem[], query: string): WorkspaceRetrievalItem[] {
  return items
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => left.score - right.score || left.item.label.localeCompare(right.item.label))
    .map(({ item }) => item);
}