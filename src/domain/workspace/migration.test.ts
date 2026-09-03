import { describe, expect, it } from 'vitest';

import { importWorkspaceJson, migrateWorkspaceSnapshot } from './io';
import { createChatReference, createInitialWorkspace, createLocalNote } from './model';

describe('workspace schema migration', () => {
  it('migrates v1 chat and note artifacts into schema v4 without inventing product-specific templates', () => {
    const current = createInitialWorkspace(10);
    current.chatRefs = [createChatReference({ id: 'chat-1', label: 'Chat', target: 'https://chatgpt.com/c/1', folderId: null, now: 10 })];
    current.notes = [createLocalNote({ id: 'note-1', title: 'Note', folderId: null, now: 10 })];

    const legacy = {
      id: current.id,
      name: current.name,
      schemaVersion: 1,
      folders: current.folders,
      chatRefs: current.chatRefs.map((chat) => ({
        id: chat.id,
        provider: chat.provider,
        target: chat.target,
        label: chat.label,
        folderId: chat.folderId,
        pinned: chat.pinned,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })),
      notes: current.notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        folderId: note.folderId,
        linkedChatIds: note.linkedChatIds,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
      manualEdges: current.manualEdges,
      tabs: current.tabs,
      activeTabId: current.activeTabId,
      layout: current.layout,
      updatedAt: current.updatedAt,
    };

    const migrated = migrateWorkspaceSnapshot(legacy);
    expect(migrated?.schemaVersion).toBe(4);
    expect(migrated?.chatRefs[0]?.annotation).toBe('');
    expect(migrated?.chatRefs[0]?.archivedAt).toBeNull();
    expect(migrated?.notes[0]?.archivedAt).toBeNull();
    expect(migrated?.notes[0]?.properties).toEqual({});
    expect(migrated?.savedViews).toEqual([]);
    expect(migrated?.noteTemplates).toEqual([]);
    expect(importWorkspaceJson(JSON.stringify(legacy))).toEqual(migrated);
  });

  it('migrates schema v2 notes into v4 without losing archive lifecycle or note data', () => {
    const current = createInitialWorkspace(10);
    const note = {
      ...createLocalNote({ id: 'note-1', title: 'Research', folderId: null, now: 5 }),
      content: 'Existing Markdown',
      tags: ['backend'],
      archivedAt: 9,
    };
    const legacy = {
      id: current.id,
      name: current.name,
      schemaVersion: 2,
      folders: current.folders,
      chatRefs: current.chatRefs,
      notes: [{
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        folderId: note.folderId,
        linkedChatIds: note.linkedChatIds,
        archivedAt: note.archivedAt,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }],
      manualEdges: current.manualEdges,
      tabs: current.tabs,
      activeTabId: current.activeTabId,
      layout: current.layout,
      updatedAt: current.updatedAt,
    };

    const migrated = migrateWorkspaceSnapshot(legacy);
    expect(migrated?.schemaVersion).toBe(4);
    expect(migrated?.notes[0]).toMatchObject({
      id: 'note-1',
      title: 'Research',
      content: 'Existing Markdown',
      tags: ['backend'],
      archivedAt: 9,
      properties: {},
    });
    expect(migrated?.noteTemplates).toEqual([]);
  });

  it('migrates schema v3 into v4 while preserving existing saved views, templates, and relationships', () => {
    const current = createInitialWorkspace(10);
    const chat = createChatReference({ id: 'chat-1', label: 'Transactions', target: 'https://chatgpt.com/c/tx', folderId: null, now: 2 });
    const note = { ...createLocalNote({ id: 'note-1', title: 'MVCC', folderId: null, now: 3 }), properties: { status: 'research' } };
    const legacyTemplate = {
      id: 'template-learning',
      name: 'Learning Note',
      titlePattern: '{{title}}',
      content: '# Summary',
      tags: [],
      properties: { type: 'learning' },
      createdAt: 4,
      updatedAt: 4,
    };
    const legacy = {
      ...current,
      schemaVersion: 3,
      chatRefs: [{
        id: chat.id,
        provider: chat.provider,
        target: chat.target,
        label: chat.label,
        folderId: chat.folderId,
        pinned: chat.pinned,
        archivedAt: chat.archivedAt,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      }],
      notes: [note],
      savedViews: [{ id: 'view-1', name: 'Research', filters: [{ property: 'status', value: 'research' }], createdAt: 5, updatedAt: 5 }],
      noteTemplates: [legacyTemplate],
      manualEdges: [{ id: 'edge-1', sourceEntityId: note.id, targetEntityId: chat.id, kind: 'related-manually' as const, createdAt: 6 }],
    };

    const migrated = migrateWorkspaceSnapshot(legacy);
    expect(migrated?.schemaVersion).toBe(4);
    expect(migrated?.chatRefs[0]).toMatchObject({ id: 'chat-1', annotation: '' });
    expect(migrated?.savedViews).toEqual(legacy.savedViews);
    expect(migrated?.noteTemplates).toEqual([legacyTemplate]);
    expect(migrated?.manualEdges).toEqual(legacy.manualEdges);
    expect(importWorkspaceJson(JSON.stringify(legacy))).toEqual(migrated);
  });

  it('does not reinterpret malformed legacy state as a valid migration', () => {
    expect(migrateWorkspaceSnapshot({ schemaVersion: 1, folders: 'wrong' })).toBeNull();
    expect(migrateWorkspaceSnapshot({ schemaVersion: 2, folders: 'wrong' })).toBeNull();
    expect(migrateWorkspaceSnapshot({ schemaVersion: 3, folders: 'wrong' })).toBeNull();
    expect(() => importWorkspaceJson('{"schemaVersion":1,"folders":"wrong"}')).toThrow(/invalid/i);
  });
});
