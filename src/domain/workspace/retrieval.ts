import type { ChatReference, LocalNote, WorkspaceFolder } from './model';

export type WorkspaceArtifactKind = 'chat' | 'note';
export type WorkspaceArtifactRef = { kind: WorkspaceArtifactKind; id: string };
export type WorkspaceFilter = 'all' | 'notes' | 'chats' | 'pinned' | 'unfiled' | 'archived';

export interface WorkspaceRetrievalItem {
  id: string;
  kind: 'folder' | WorkspaceArtifactKind | 'view' | 'command';
  label: string;
  searchText: string;
  contextText?: string;
  contentText?: string;
  detail?: string;
  pinned?: boolean;
  updatedAt?: number;
  priority?: number;
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
  if (kind === 'chat') {
    const chat = artifact as ChatReference;
    return `${chat.label}\n${chat.annotation}`.toLocaleLowerCase().includes(normalized);
  }
  const note = artifact as LocalNote;
  const properties = Object.entries(note.properties).map(([key, value]) => `${key} ${JSON.stringify(value)}`).join(' ');
  return `${note.title}\n${note.tags.join(' ')}\n${properties}\n${note.content}`.toLocaleLowerCase().includes(normalized);
}

export function folderMatchesQuery(folder: WorkspaceFolder, query: string): boolean {
  const normalized = normalizedText(query);
  return normalized === '' || folder.name.toLocaleLowerCase().includes(normalized);
}

function queryMatchScore(item: WorkspaceRetrievalItem, query: string): number {
  const normalized = normalizedText(query);
  if (normalized === '') return 0;

  const label = item.label.toLocaleLowerCase();
  const context = (item.contextText ?? '').toLocaleLowerCase();
  const searchText = item.searchText.toLocaleLowerCase();
  const content = (item.contentText ?? '').toLocaleLowerCase();

  if (label === normalized) return 0;
  if (label.startsWith(normalized)) return 10;
  if (label.includes(normalized)) return 20;
  if (context.includes(normalized)) return 30;
  if (searchText.includes(normalized)) return 40;
  if (content.includes(normalized)) return 50;
  return Number.POSITIVE_INFINITY;
}

function emptyQueryGroup(item: WorkspaceRetrievalItem): number {
  if (item.kind === 'chat' || item.kind === 'note') return 0;
  if (item.kind === 'command') return 1;
  return 2;
}

function compareSignals(left: WorkspaceRetrievalItem, right: WorkspaceRetrievalItem): number {
  const pinDelta = Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
  if (pinDelta !== 0) return pinDelta;

  const recencyDelta = (right.updatedAt ?? Number.NEGATIVE_INFINITY) - (left.updatedAt ?? Number.NEGATIVE_INFINITY);
  if (recencyDelta !== 0) return recencyDelta;

  const priorityDelta = (left.priority ?? 100) - (right.priority ?? 100);
  if (priorityDelta !== 0) return priorityDelta;

  return left.label.localeCompare(right.label);
}

export function rankRetrievalItems(items: WorkspaceRetrievalItem[], query: string): WorkspaceRetrievalItem[] {
  const normalized = normalizedText(query);

  if (normalized === '') {
    return [...items].sort((left, right) => {
      const groupDelta = emptyQueryGroup(left) - emptyQueryGroup(right);
      return groupDelta !== 0 ? groupDelta : compareSignals(left, right);
    });
  }

  return items
    .map((item) => ({ item, score: queryMatchScore(item, normalized) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => left.score - right.score || compareSignals(left.item, right.item))
    .map(({ item }) => item);
}
