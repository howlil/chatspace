import { describe, expect, it } from 'vitest';

import { importWorkspaceJson, migrateWorkspaceSnapshot } from './io';
import { createChatReference, createInitialWorkspace, createLocalNote } from './model';

describe('workspace schema migration', () => {
  it('migrates v1 chat and note artifacts into v2 archive lifecycle', () => {
    const current = createInitialWorkspace(10);
    current.chatRefs = [createChatReference({ id: 'chat-1', label: 'Chat', target: 'https://chatgpt.com/c/1', folderId: null, now: 10 })];
    current.notes = [createLocalNote({ id: 'note-1', title: 'Note', folderId: null, now: 10 })];

    const legacy = {
      ...current,
      schemaVersion: 1,
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
    };

    const migrated = migrateWorkspaceSnapshot(legacy);
    expect(migrated?.schemaVersion).toBe(2);
    expect(migrated?.chatRefs[0]?.archivedAt).toBeNull();
    expect(migrated?.notes[0]?.archivedAt).toBeNull();
    expect(importWorkspaceJson(JSON.stringify(legacy))).toEqual(migrated);
  });

  it('does not reinterpret malformed v1 state as a valid migration', () => {
    expect(migrateWorkspaceSnapshot({ schemaVersion: 1, folders: 'wrong' })).toBeNull();
    expect(() => importWorkspaceJson('{"schemaVersion":1,"folders":"wrong"}')).toThrow(/invalid/i);
  });
});
