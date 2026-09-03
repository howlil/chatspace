import { normalizeNoteTitle, parseNoteLinks, rewriteInboundLinksForRename } from '../notes/noteLinks';
import {
  INBOX_FOLDER_ID,
  createEntityId,
  createFolder,
  createLocalNote,
  type LocalNote,
  type WorkspaceFolder,
  type WorkspaceSnapshot,
} from './model';

export interface MarkdownSourceFile {
  path: string;
  content: string;
}

export interface MarkdownImportCandidate {
  sourcePath: string;
  title: string;
  content: string;
  tags: string[];
  folderPath: string[];
  requestedNoteId: string | null;
  wikilinks: string[];
}

export type MarkdownImportConflictKind = 'id-match' | 'title-match' | 'incoming-title';

export interface MarkdownImportConflict {
  sourcePath: string;
  kind: MarkdownImportConflictKind;
  existingNoteId: string | null;
  existingTitle: string | null;
  incomingPeerPath: string | null;
}

export interface MarkdownImportScan {
  rootName: string;
  baseWorkspaceUpdatedAt: number;
  notes: MarkdownImportCandidate[];
  folderCount: number;
  resolvedLinks: number;
  unresolvedLinks: number;
  conflicts: MarkdownImportConflict[];
  warnings: string[];
}

export type MarkdownImportAction =
  | 'update-existing'
  | 'keep-existing'
  | 'duplicate'
  | 'rename-incoming'
  | 'skip';

export interface MarkdownImportDecision {
  sourcePath: string;
  action: MarkdownImportAction;
  renameTo: string | null;
}

export interface MarkdownImportApplyResult {
  snapshot: WorkspaceSnapshot;
  imported: number;
  updated: number;
  duplicated: number;
  skipped: number;
}

interface ParsedFrontmatter {
  metadata: Record<string, unknown>;
  body: string;
}

function cleanPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function parseScalar(raw: string): unknown {
  const value = raw.trim();
  if (value === '') return '';
  try {
    return JSON.parse(value) as unknown;
  } catch {
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    if (value === 'null' || value === '~') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
    if (value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1).split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    }
    return value;
  }
}

function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const normalized = markdown.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) return { metadata: {}, body: normalized };
  const close = normalized.indexOf('\n---\n', 4);
  if (close < 0) throw new Error('Unclosed YAML frontmatter.');

  const metadata: Record<string, unknown> = {};
  const lines = normalized.slice(4, close).split('\n');
  let listKey: string | null = null;
  for (const line of lines) {
    const listMatch = /^\s+-\s+(.+)$/.exec(line);
    if (listKey !== null && listMatch !== null) {
      const existing = Array.isArray(metadata[listKey]) ? metadata[listKey] as unknown[] : [];
      metadata[listKey] = [...existing, parseScalar(listMatch[1] ?? '')];
      continue;
    }

    const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line);
    if (match === null) {
      if (line.trim() !== '' && !line.trim().startsWith('#')) throw new Error(`Unsupported frontmatter line: ${line.trim()}`);
      continue;
    }
    const key = match[1] ?? '';
    const raw = match[2] ?? '';
    if (raw.trim() === '') {
      metadata[key] = [];
      listKey = key;
    } else {
      metadata[key] = parseScalar(raw);
      listKey = null;
    }
  }

  return { metadata, body: normalized.slice(close + 5) };
}

function stringMetadata(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function tagsMetadata(metadata: Record<string, unknown>): string[] {
  const value = metadata.tags;
  if (Array.isArray(value)) {
    return [...new Set(value.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim().toLocaleLowerCase()).filter(Boolean))];
  }
  if (typeof value === 'string') {
    return [...new Set(value.split(',').map((tag) => tag.trim().toLocaleLowerCase()).filter(Boolean))];
  }
  return [];
}

function portableLabel(segment: string, portable: boolean): string {
  if (!portable) return segment;
  const separator = segment.lastIndexOf('--');
  return separator > 0 ? segment.slice(0, separator) : segment;
}

function fallbackTitle(path: string, portable: boolean): string {
  const name = cleanPath(path).split('/').pop() ?? 'Untitled note.md';
  const stem = name.replace(/\.md$/i, '');
  return portableLabel(stem, portable).trim() || 'Untitled note';
}

function headingTitle(body: string): string | null {
  for (const line of body.split('\n')) {
    const match = /^#\s+(.+)$/.exec(line.trim());
    if (match !== null && (match[1] ?? '').trim() !== '') return (match[1] ?? '').trim();
  }
  return null;
}

function parseCandidate(file: MarkdownSourceFile): { candidate: MarkdownImportCandidate | null; warning: string | null } {
  const sourcePath = cleanPath(file.path);
  if (!sourcePath.toLocaleLowerCase().endsWith('.md')) return { candidate: null, warning: null };
  const parsed = parseFrontmatter(file.content);
  const type = stringMetadata(parsed.metadata, 'chatspace_type');
  if (type !== null && type !== 'note') {
    return { candidate: null, warning: `${sourcePath}: skipped Chatspace ${type} Markdown.` };
  }
  const portable = type === 'note';
  let pathParts = sourcePath.split('/').filter(Boolean);
  const fileName = pathParts.pop() ?? sourcePath;
  if (portable && pathParts[0] === 'notes') pathParts = pathParts.slice(1);
  const folderPath = pathParts.map((segment) => portableLabel(segment, portable)).filter(Boolean);
  const title = stringMetadata(parsed.metadata, 'title') ?? headingTitle(parsed.body) ?? fallbackTitle(fileName, portable);
  const links = parseNoteLinks(parsed.body).map((token) => token.title);
  return {
    candidate: {
      sourcePath,
      title: title.trim().replace(/\s+/g, ' ').slice(0, 160) || 'Untitled note',
      content: parsed.body,
      tags: tagsMetadata(parsed.metadata),
      folderPath,
      requestedNoteId: stringMetadata(parsed.metadata, 'chatspace_id'),
      wikilinks: links,
    },
    warning: null,
  };
}

function titleMatches(notes: LocalNote[], title: string): LocalNote[] {
  const normalized = normalizeNoteTitle(title);
  return notes.filter((note) => normalizeNoteTitle(note.title) === normalized);
}

export function scanMarkdownImport(
  snapshot: WorkspaceSnapshot,
  files: MarkdownSourceFile[],
  rootName = 'Markdown folder',
): MarkdownImportScan {
  const candidates: MarkdownImportCandidate[] = [];
  const warnings: string[] = [];

  for (const file of [...files].sort((left, right) => left.path.localeCompare(right.path))) {
    try {
      const parsed = parseCandidate(file);
      if (parsed.warning !== null) warnings.push(parsed.warning);
      if (parsed.candidate !== null) candidates.push(parsed.candidate);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Markdown parse failed.';
      throw new Error(`${cleanPath(file.path)}: ${message}`);
    }
  }

  const conflicts: MarkdownImportConflict[] = [];
  const conflictPaths = new Set<string>();
  const byRequestedId = new Map(snapshot.notes.map((note) => [note.id, note]));

  for (const candidate of candidates) {
    if (candidate.requestedNoteId !== null) {
      const existing = byRequestedId.get(candidate.requestedNoteId);
      if (existing !== undefined) {
        conflicts.push({
          sourcePath: candidate.sourcePath,
          kind: 'id-match',
          existingNoteId: existing.id,
          existingTitle: existing.title,
          incomingPeerPath: null,
        });
        conflictPaths.add(candidate.sourcePath);
        continue;
      }
    }
    const existingTitles = titleMatches(snapshot.notes, candidate.title);
    if (existingTitles.length > 0) {
      const existing = existingTitles[0]!;
      conflicts.push({
        sourcePath: candidate.sourcePath,
        kind: 'title-match',
        existingNoteId: existing.id,
        existingTitle: existing.title,
        incomingPeerPath: null,
      });
      conflictPaths.add(candidate.sourcePath);
    }
  }

  const incomingByTitle = new Map<string, MarkdownImportCandidate[]>();
  for (const candidate of candidates) {
    const key = normalizeNoteTitle(candidate.title);
    const group = incomingByTitle.get(key) ?? [];
    group.push(candidate);
    incomingByTitle.set(key, group);
  }
  for (const group of incomingByTitle.values()) {
    if (group.length < 2) continue;
    for (const candidate of group) {
      if (conflictPaths.has(candidate.sourcePath)) continue;
      const peer = group.find((item) => item.sourcePath !== candidate.sourcePath);
      conflicts.push({
        sourcePath: candidate.sourcePath,
        kind: 'incoming-title',
        existingNoteId: null,
        existingTitle: null,
        incomingPeerPath: peer?.sourcePath ?? null,
      });
      conflictPaths.add(candidate.sourcePath);
    }
  }

  const combinedTitles = new Map<string, number>();
  for (const note of snapshot.notes.filter((note) => note.archivedAt === null)) {
    const key = normalizeNoteTitle(note.title);
    combinedTitles.set(key, (combinedTitles.get(key) ?? 0) + 1);
  }
  for (const candidate of candidates) {
    const key = normalizeNoteTitle(candidate.title);
    combinedTitles.set(key, (combinedTitles.get(key) ?? 0) + 1);
  }

  let resolvedLinks = 0;
  let unresolvedLinks = 0;
  for (const candidate of candidates) {
    for (const title of candidate.wikilinks) {
      if ((combinedTitles.get(normalizeNoteTitle(title)) ?? 0) === 1) resolvedLinks += 1;
      else unresolvedLinks += 1;
    }
  }

  const folderKeys = new Set(candidates.flatMap((candidate) => candidate.folderPath.map((_, index) => candidate.folderPath.slice(0, index + 1).join('/'))));
  return {
    rootName,
    baseWorkspaceUpdatedAt: snapshot.updatedAt,
    notes: candidates,
    folderCount: folderKeys.size,
    resolvedLinks,
    unresolvedLinks,
    conflicts: conflicts.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath)),
    warnings,
  };
}

function folderNameKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function findReusableFolder(folders: WorkspaceFolder[], name: string, parentId: string | null): WorkspaceFolder | null {
  const matches = folders.filter((folder) => (
    folder.id !== INBOX_FOLDER_ID &&
    folder.parentId === parentId &&
    folderNameKey(folder.name) === folderNameKey(name)
  ));
  return matches.length === 1 ? matches[0] ?? null : null;
}

function ensureFolderPath(
  folders: WorkspaceFolder[],
  path: string[],
  now: number,
  idFactory: (prefix: string) => string,
): { folders: WorkspaceFolder[]; folderId: string | null } {
  let nextFolders = folders;
  let parentId: string | null = null;
  for (const rawName of path) {
    const name = rawName.trim().replace(/\s+/g, ' ') || 'Untitled folder';
    const reusable = findReusableFolder(nextFolders, name, parentId);
    if (reusable !== null) {
      parentId = reusable.id;
      continue;
    }
    const folder = createFolder({ id: idFactory('folder'), name, parentId, now });
    nextFolders = [...nextFolders, folder];
    parentId = folder.id;
  }
  return { folders: nextFolders, folderId: parentId };
}

function allowedActions(kind: MarkdownImportConflictKind): Set<MarkdownImportAction> {
  return kind === 'id-match'
    ? new Set(['update-existing', 'keep-existing', 'duplicate'])
    : new Set(['keep-existing', 'duplicate', 'rename-incoming', 'skip']);
}

export function applyMarkdownImport(
  snapshot: WorkspaceSnapshot,
  scan: MarkdownImportScan,
  decisions: MarkdownImportDecision[],
  now = Date.now(),
  idFactory: (prefix: string) => string = createEntityId,
): MarkdownImportApplyResult {
  if (snapshot.updatedAt !== scan.baseWorkspaceUpdatedAt) {
    throw new Error('Workspace changed after the Markdown scan. Scan the folder again before importing.');
  }

  const decisionByPath = new Map(decisions.map((decision) => [decision.sourcePath, decision]));
  const conflictByPath = new Map(scan.conflicts.map((conflict) => [conflict.sourcePath, conflict]));
  for (const conflict of scan.conflicts) {
    const decision = decisionByPath.get(conflict.sourcePath);
    if (decision === undefined) throw new Error(`Resolve the conflict for ${conflict.sourcePath} before importing.`);
    if (!allowedActions(conflict.kind).has(decision.action)) throw new Error(`Invalid conflict resolution for ${conflict.sourcePath}.`);
    if (decision.action === 'rename-incoming' && (decision.renameTo?.trim() ?? '') === '') {
      throw new Error(`Choose a new title for ${conflict.sourcePath}.`);
    }
  }

  let folders = [...snapshot.folders];
  let notes = [...snapshot.notes];
  let imported = 0;
  let updated = 0;
  let duplicated = 0;
  let skipped = 0;
  const usedIds = new Set([
    ...snapshot.folders.map((folder) => folder.id),
    ...snapshot.chatRefs.map((chat) => chat.id),
    ...snapshot.notes.map((note) => note.id),
  ]);

  for (const candidate of scan.notes) {
    const conflict = conflictByPath.get(candidate.sourcePath);
    const decision = conflict === undefined ? null : decisionByPath.get(candidate.sourcePath) ?? null;
    const action: MarkdownImportAction | 'import' = decision?.action ?? 'import';
    if (action === 'keep-existing' || action === 'skip') {
      skipped += 1;
      continue;
    }

    const folderResult = ensureFolderPath(folders, candidate.folderPath, now, idFactory);
    folders = folderResult.folders;
    const title = action === 'rename-incoming'
      ? decision?.renameTo?.trim().replace(/\s+/g, ' ').slice(0, 160) ?? candidate.title
      : candidate.title;

    if (action === 'rename-incoming') {
      const collision = notes.some((note) => normalizeNoteTitle(note.title) === normalizeNoteTitle(title));
      if (collision) throw new Error(`The renamed incoming note “${title}” still conflicts with an existing note.`);
    }

    if (action === 'update-existing') {
      const existingId = conflict?.existingNoteId;
      if (existingId === null || existingId === undefined) throw new Error(`No existing note is available to update for ${candidate.sourcePath}.`);
      const existing = notes.find((note) => note.id === existingId);
      if (existing === undefined) throw new Error(`The existing note for ${candidate.sourcePath} no longer exists.`);
      if (existing.title !== title) notes = rewriteInboundLinksForRename(notes, existing.id, title, now);
      notes = notes.map((note) => note.id === existing.id ? {
        ...note,
        title,
        content: candidate.content,
        tags: candidate.tags,
        folderId: folderResult.folderId,
        updatedAt: now,
      } : note);
      updated += 1;
      continue;
    }

    let id = candidate.requestedNoteId;
    if (action === 'duplicate' || id === null || usedIds.has(id)) id = idFactory('note');
    while (usedIds.has(id)) id = idFactory('note');
    usedIds.add(id);
    const created = {
      ...createLocalNote({ id, title, folderId: folderResult.folderId, now }),
      content: candidate.content,
      tags: candidate.tags,
    };
    notes = [...notes, created];
    if (action === 'duplicate') duplicated += 1;
    else imported += 1;
  }

  const updatedNoteIds = new Set(notes.map((note) => note.id));
  const tabs = snapshot.tabs.map((tab) => {
    if (tab.kind !== 'note' || tab.entityId === null || !updatedNoteIds.has(tab.entityId)) return tab;
    const note = notes.find((candidate) => candidate.id === tab.entityId);
    return note === undefined ? tab : { ...tab, title: note.title };
  });

  return {
    snapshot: { ...snapshot, folders, notes, tabs, updatedAt: now },
    imported,
    updated,
    duplicated,
    skipped,
  };
}