import { deriveOutgoingNoteIds } from '../notes/noteLinks';
import type { ChatReference, LocalNote, WorkspaceFolder, WorkspaceSnapshot } from './model';

export const PORTABLE_EXPORT_FORMAT = 'chatspace-portable-knowledge' as const;
export const PORTABLE_EXPORT_VERSION = 1 as const;

export interface PortableExportFile {
  path: string;
  content: string;
}

export interface PortableWorkspaceBundle {
  rootDirectoryName: string;
  files: PortableExportFile[];
}

interface PortableFolderEntry {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
}

interface PortableNoteLink {
  sourceNoteId: string;
  sourceTitle: string;
  targetNoteId: string;
  targetTitle: string;
}

interface PortableLinkedChat {
  noteId: string;
  noteTitle: string;
  chatId: string;
  chatLabel: string;
}

const WINDOWS_RESERVED_NAMES = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);

export function portablePathSegment(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .trim()
    .replace(/[. ]+$/g, '')
    .slice(0, 80)
    .trim();
  const candidate = normalized === '' ? fallback : normalized;
  return WINDOWS_RESERVED_NAMES.has(candidate.toLocaleLowerCase()) ? `_${candidate}` : candidate;
}

function idSegment(id: string): string {
  return portablePathSegment(id, 'item').replace(/\s+/g, '-');
}

function artifactFilename(label: string, id: string): string {
  return `${portablePathSegment(label, 'Untitled')}--${idSegment(id)}.md`;
}

function directorySegment(folder: WorkspaceFolder): string {
  return `${portablePathSegment(folder.name, 'Untitled folder')}--${idSegment(folder.id)}`;
}

function folderPath(folderId: string | null, folders: WorkspaceFolder[]): string {
  if (folderId === null) return '_root';
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const segments: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = folderId;

  while (currentId !== null && !visited.has(currentId)) {
    visited.add(currentId);
    const folder = byId.get(currentId);
    if (folder === undefined) break;
    segments.unshift(directorySegment(folder));
    currentId = folder.parentId;
  }

  return segments.length === 0 ? '_root' : segments.join('/');
}

function yamlValue(value: string | number | boolean | null | string[]): string {
  return JSON.stringify(value);
}

function frontmatter(entries: Array<[string, string | number | boolean | null | string[]]>): string {
  return `---\n${entries.map(([key, value]) => `${key}: ${yamlValue(value)}`).join('\n')}\n---\n`;
}

function noteMarkdown(note: LocalNote): string {
  const metadata = frontmatter([
    ['chatspace_type', 'note'],
    ['chatspace_id', note.id],
    ['title', note.title],
    ['folder_id', note.folderId],
    ['tags', note.tags],
    ['linked_chat_ids', note.linkedChatIds],
    ['archived_at', note.archivedAt],
    ['created_at', note.createdAt],
    ['updated_at', note.updatedAt],
  ]);
  return `${metadata}\n${note.content}`;
}

function chatReferenceMarkdown(chat: ChatReference): string {
  const metadata = frontmatter([
    ['chatspace_type', 'chat-reference'],
    ['chatspace_id', chat.id],
    ['provider', chat.provider],
    ['label', chat.label],
    ['target', chat.target],
    ['folder_id', chat.folderId],
    ['pinned', chat.pinned],
    ['archived_at', chat.archivedAt],
    ['created_at', chat.createdAt],
    ['updated_at', chat.updatedAt],
  ]);
  return `${metadata}\n# ${chat.label}\n\n<${chat.target}>\n`;
}

function noteLinks(snapshot: WorkspaceSnapshot): PortableNoteLink[] {
  const activeNotes = snapshot.notes.filter((note) => note.archivedAt === null);
  const byId = new Map(activeNotes.map((note) => [note.id, note]));
  const links: PortableNoteLink[] = [];

  for (const source of activeNotes) {
    for (const targetId of deriveOutgoingNoteIds(source, activeNotes)) {
      const target = byId.get(targetId);
      if (target === undefined) continue;
      links.push({
        sourceNoteId: source.id,
        sourceTitle: source.title,
        targetNoteId: target.id,
        targetTitle: target.title,
      });
    }
  }

  return links.sort((left, right) =>
    left.sourceNoteId.localeCompare(right.sourceNoteId) || left.targetNoteId.localeCompare(right.targetNoteId));
}

function linkedChats(snapshot: WorkspaceSnapshot): PortableLinkedChat[] {
  const chatById = new Map(snapshot.chatRefs.map((chat) => [chat.id, chat]));
  const links: PortableLinkedChat[] = [];
  for (const note of snapshot.notes) {
    for (const chatId of note.linkedChatIds) {
      const chat = chatById.get(chatId);
      if (chat === undefined) continue;
      links.push({ noteId: note.id, noteTitle: note.title, chatId: chat.id, chatLabel: chat.label });
    }
  }
  return links.sort((left, right) => left.noteId.localeCompare(right.noteId) || left.chatId.localeCompare(right.chatId));
}

function folderEntries(snapshot: WorkspaceSnapshot): PortableFolderEntry[] {
  return snapshot.folders
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      path: folderPath(folder.id, snapshot.folders),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

export function buildPortableWorkspaceBundle(snapshot: WorkspaceSnapshot, exportedAt = Date.now()): PortableWorkspaceBundle {
  const rootDirectoryName = `Chatspace Export--${portablePathSegment(snapshot.name, 'Workspace')}`;
  const files: PortableExportFile[] = [];
  const relationships = {
    version: PORTABLE_EXPORT_VERSION,
    linkedChats: linkedChats(snapshot),
    noteLinks: noteLinks(snapshot),
    manualEdges: [...snapshot.manualEdges].sort((left, right) => left.id.localeCompare(right.id)),
  };
  const manifest = {
    format: PORTABLE_EXPORT_FORMAT,
    version: PORTABLE_EXPORT_VERSION,
    exportedAt: new Date(exportedAt).toISOString(),
    workspace: {
      id: snapshot.id,
      name: snapshot.name,
      schemaVersion: snapshot.schemaVersion,
      updatedAt: snapshot.updatedAt,
    },
    counts: {
      folders: snapshot.folders.length,
      notes: snapshot.notes.length,
      archivedNotes: snapshot.notes.filter((note) => note.archivedAt !== null).length,
      chatReferences: snapshot.chatRefs.length,
      archivedChatReferences: snapshot.chatRefs.filter((chat) => chat.archivedAt !== null).length,
      manualRelationships: snapshot.manualEdges.length,
    },
    folders: folderEntries(snapshot),
    files: {
      workspaceBackup: 'workspace.json',
      relationships: 'relationships.json',
      notesRoot: 'notes',
      chatReferencesRoot: 'chat-references',
    },
    boundaries: {
      providerContentIncluded: false,
      chatReferencesContainLocalMetadataOnly: true,
      selectedFilesystemHandleIncluded: false,
    },
  };

  files.push({ path: 'manifest.json', content: `${JSON.stringify(manifest, null, 2)}\n` });
  files.push({ path: 'workspace.json', content: `${JSON.stringify(snapshot, null, 2)}\n` });
  files.push({ path: 'relationships.json', content: `${JSON.stringify(relationships, null, 2)}\n` });

  for (const note of [...snapshot.notes].sort((left, right) => left.id.localeCompare(right.id))) {
    const path = `notes/${folderPath(note.folderId, snapshot.folders)}/${artifactFilename(note.title, note.id)}`;
    files.push({ path, content: noteMarkdown(note) });
  }

  for (const chat of [...snapshot.chatRefs].sort((left, right) => left.id.localeCompare(right.id))) {
    const path = `chat-references/${folderPath(chat.folderId, snapshot.folders)}/${artifactFilename(chat.label, chat.id)}`;
    files.push({ path, content: chatReferenceMarkdown(chat) });
  }

  return { rootDirectoryName, files };
}
