import type { LocalNote } from '../workspace/model';

export type NoteLinkStatus = 'resolved' | 'unresolved' | 'ambiguous';

export interface NoteLinkToken {
  title: string;
  start: number;
  end: number;
}

export interface ResolvedNoteLink {
  token: NoteLinkToken;
  status: NoteLinkStatus;
  targetNoteId: string | null;
  matchingNoteIds: string[];
}

export interface NoteBacklink {
  sourceNoteId: string;
  sourceTitle: string;
  token: NoteLinkToken;
}

export interface ActiveWikilinkQuery {
  start: number;
  end: number;
  query: string;
}

export function normalizeNoteTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function parseNoteLinks(markdown: string): NoteLinkToken[] {
  const source = markdown.replace(/\r\n/g, '\n');
  const tokens: NoteLinkToken[] = [];
  let offset = 0;
  let inFence = false;

  for (const line of source.split('\n')) {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      offset += line.length + 1;
      continue;
    }

    if (!inFence) {
      const pattern = /\[\[([^\]\n]+)\]\]/g;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line)) !== null) {
        const title = (match[1] ?? '').trim();
        if (title !== '') {
          tokens.push({
            title,
            start: offset + match.index,
            end: offset + match.index + match[0].length,
          });
        }
      }
    }

    offset += line.length + 1;
  }

  return tokens;
}

export function resolveNoteLinkTitle(title: string, notes: LocalNote[]): ResolvedNoteLink {
  const normalized = normalizeNoteTitle(title);
  const matchingNoteIds = notes
    .filter((note) => normalizeNoteTitle(note.title) === normalized)
    .map((note) => note.id);
  const status: NoteLinkStatus = matchingNoteIds.length === 1
    ? 'resolved'
    : matchingNoteIds.length === 0
      ? 'unresolved'
      : 'ambiguous';

  return {
    token: { title, start: 0, end: title.length },
    status,
    targetNoteId: status === 'resolved' ? matchingNoteIds[0] ?? null : null,
    matchingNoteIds,
  };
}

export function resolveNoteLinks(note: LocalNote, notes: LocalNote[]): ResolvedNoteLink[] {
  const byTitle = new Map<string, string[]>();
  for (const candidate of notes) {
    const normalized = normalizeNoteTitle(candidate.title);
    const matches = byTitle.get(normalized) ?? [];
    matches.push(candidate.id);
    byTitle.set(normalized, matches);
  }

  return parseNoteLinks(note.content).map((token) => {
    const matchingNoteIds = byTitle.get(normalizeNoteTitle(token.title)) ?? [];
    const status: NoteLinkStatus = matchingNoteIds.length === 1
      ? 'resolved'
      : matchingNoteIds.length === 0
        ? 'unresolved'
        : 'ambiguous';
    return {
      token,
      status,
      targetNoteId: status === 'resolved' ? matchingNoteIds[0] ?? null : null,
      matchingNoteIds,
    };
  });
}

export function deriveOutgoingNoteIds(note: LocalNote, notes: LocalNote[]): string[] {
  const ids = new Set<string>();
  for (const link of resolveNoteLinks(note, notes)) {
    if (link.status === 'resolved' && link.targetNoteId !== null && link.targetNoteId !== note.id) {
      ids.add(link.targetNoteId);
    }
  }
  return [...ids];
}

export function deriveBacklinks(targetNoteId: string, notes: LocalNote[]): NoteBacklink[] {
  const backlinks: NoteBacklink[] = [];
  for (const source of notes) {
    if (source.id === targetNoteId) continue;
    for (const link of resolveNoteLinks(source, notes)) {
      if (link.status === 'resolved' && link.targetNoteId === targetNoteId) {
        backlinks.push({ sourceNoteId: source.id, sourceTitle: source.title, token: link.token });
      }
    }
  }
  return backlinks;
}

export function findActiveWikilinkQuery(content: string, cursor: number): ActiveWikilinkQuery | null {
  const beforeCursor = content.slice(0, cursor);
  const start = beforeCursor.lastIndexOf('[[');
  if (start < 0) return null;
  const candidate = beforeCursor.slice(start + 2);
  if (candidate.includes(']]') || candidate.includes('\n') || candidate.includes('\r')) return null;
  return { start, end: cursor, query: candidate };
}

export function noteLinkPairKey(sourceNoteId: string, targetNoteId: string): string {
  return sourceNoteId < targetNoteId
    ? `${sourceNoteId}\u0000${targetNoteId}`
    : `${targetNoteId}\u0000${sourceNoteId}`;
}
