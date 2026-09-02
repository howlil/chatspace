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
      chatRefs: current.chatRefs.map(({ archivedAt: _archivedAt, ...chat }) => chat),
      notes: current.notes.map(({ archivedAt: _archivedAt, ...note }) => note),
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
