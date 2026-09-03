import { describe, expect, it } from 'vitest';

import { createChatReference, createFolder, createInitialWorkspace, createLocalNote } from './model';
import { buildPortableWorkspaceBundle, portablePathSegment } from './portableExport';

describe('portable workspace export', () => {
  it('projects user-owned workspace data into deterministic Markdown hierarchy and metadata files', () => {
    const snapshot = createInitialWorkspace(100);
    snapshot.name = 'Backend / Research';
    const backend = createFolder({ id: 'folder-backend', name: 'Backend', parentId: null, now: 1 });
    const db = createFolder({ id: 'folder-db', name: 'Database', parentId: backend.id, now: 2 });
    const chat = {
      ...createChatReference({
        id: 'chat-mvcc',
        label: 'MVCC discussion',
        target: 'https://chatgpt.com/c/mvcc',
        folderId: db.id,
        now: 3,
      }),
      pinned: true,
    };
    const mvcc = {
      ...createLocalNote({ id: 'note-mvcc', title: 'MVCC', folderId: db.id, now: 4 }),
      content: 'Isolation connects to [[Transactions]].',
      tags: ['postgres'],
      properties: {
        status: 'research',
        priority: 2,
        reviewed: false,
        labels: ['database', 'postgres'],
        due: { type: 'date' as const, value: '2026-09-30' },
      },
      linkedChatIds: [chat.id],
    };
    const transactions = {
      ...createLocalNote({ id: 'note-transactions', title: 'Transactions', folderId: backend.id, now: 5 }),
      content: 'Atomicity and durability.',
    };
    snapshot.folders = [backend, db];
    snapshot.chatRefs = [chat];
    snapshot.notes = [mvcc, transactions];
    snapshot.manualEdges = [{
      id: 'edge-1',
      sourceEntityId: mvcc.id,
      targetEntityId: chat.id,
      kind: 'related-manually',
      createdAt: 6,
    }];

    const bundle = buildPortableWorkspaceBundle(snapshot, Date.UTC(2026, 8, 3, 5, 0, 0));

    expect(bundle.rootDirectoryName).toBe('Chatspace Export--Backend - Research');
    expect(bundle.files.map((file) => file.path)).toEqual(expect.arrayContaining([
      'manifest.json',
      'workspace.json',
      'relationships.json',
      'notes/Backend--folder-backend/Database--folder-db/MVCC--note-mvcc.md',
      'notes/Backend--folder-backend/Transactions--note-transactions.md',
      'chat-references/Backend--folder-backend/Database--folder-db/MVCC discussion--chat-mvcc.md',
    ]));

    const noteFile = bundle.files.find((file) => file.path.endsWith('/MVCC--note-mvcc.md'));
    expect(noteFile?.content).toContain('chatspace_type: "note"');
    expect(noteFile?.content).toContain('tags: ["postgres"]');
    expect(noteFile?.content).toContain('properties: {"status":"research","priority":2,"reviewed":false,"labels":["database","postgres"],"due":{"type":"date","value":"2026-09-30"}}');
    expect(noteFile?.content).toContain('linked_chat_ids: ["chat-mvcc"]');
    expect(noteFile?.content).toContain('Isolation connects to [[Transactions]].');

    const chatFile = bundle.files.find((file) => file.path.endsWith('/MVCC discussion--chat-mvcc.md'));
    expect(chatFile?.content).toContain('chatspace_type: "chat-reference"');
    expect(chatFile?.content).toContain('target: "https://chatgpt.com/c/mvcc"');
    expect(chatFile?.content).toContain('<https://chatgpt.com/c/mvcc>');

    const relationships = JSON.parse(bundle.files.find((file) => file.path === 'relationships.json')?.content ?? '{}') as {
      linkedChats?: unknown[];
      noteLinks?: unknown[];
      manualEdges?: unknown[];
    };
    expect(relationships.linkedChats).toHaveLength(1);
    expect(relationships.noteLinks).toEqual([
      expect.objectContaining({ sourceNoteId: 'note-mvcc', targetNoteId: 'note-transactions' }),
    ]);
    expect(relationships.manualEdges).toHaveLength(1);

    const manifest = JSON.parse(bundle.files.find((file) => file.path === 'manifest.json')?.content ?? '{}') as {
      counts?: { savedViews?: number; noteTemplates?: number };
    };
    expect(manifest.counts).toEqual(expect.objectContaining({ savedViews: 0, noteTemplates: 1 }));
  });

  it('includes archived local artifacts while marking the export boundary against provider content', () => {
    const snapshot = createInitialWorkspace(1);
    snapshot.notes = [{
      ...createLocalNote({ id: 'note-archived', title: 'Old note', folderId: null, now: 2 }),
      archivedAt: 10,
      content: 'User-owned local Markdown.',
    }];
    snapshot.chatRefs = [{
      ...createChatReference({ id: 'chat-archived', label: 'Old chat', target: 'https://chatgpt.com/c/old', folderId: null, now: 3 }),
      archivedAt: 11,
    }];

    const bundle = buildPortableWorkspaceBundle(snapshot, 0);
    const manifest = JSON.parse(bundle.files.find((file) => file.path === 'manifest.json')?.content ?? '{}') as {
      counts?: { archivedNotes?: number; archivedChatReferences?: number };
      boundaries?: { providerContentIncluded?: boolean; chatReferencesContainLocalMetadataOnly?: boolean };
    };

    expect(bundle.files.some((file) => file.path === 'notes/_root/Old note--note-archived.md')).toBe(true);
    expect(bundle.files.some((file) => file.path === 'chat-references/_root/Old chat--chat-archived.md')).toBe(true);
    expect(manifest.counts).toEqual(expect.objectContaining({ archivedNotes: 1, archivedChatReferences: 1 }));
    expect(manifest.boundaries).toEqual(expect.objectContaining({
      providerContentIncluded: false,
      chatReferencesContainLocalMetadataOnly: true,
    }));
  });

  it('sanitizes portable path segments without allowing path traversal or platform-invalid names', () => {
    expect(portablePathSegment('../CON:<db>?', 'fallback')).toBe('..-CON-db-');
    expect(portablePathSegment('NUL', 'fallback')).toBe('_NUL');
    expect(portablePathSegment('   ', 'fallback')).toBe('fallback');
  });
});