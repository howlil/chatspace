import { describe, expect, it } from 'vitest';

import {
  createChatReference,
  createFolder,
  createInitialWorkspace,
  createLocalNote,
} from './model';
import { workspaceReducer } from './workspaceReducer';

describe('workspaceReducer', () => {
  it('keeps folders, chat references, notes, and tabs in one canonical snapshot', () => {
    let state = createInitialWorkspace(1);
    const folder = createFolder({ id: 'folder-db', name: 'Database', parentId: null, now: 2 });
    const chat = createChatReference({
      id: 'chat-mvcc',
      label: 'PostgreSQL MVCC',
      target: 'https://chatgpt.com/c/abc-123',
      folderId: folder.id,
      now: 3,
    });
    const note = createLocalNote({ id: 'note-mvcc', title: 'MVCC notes', folderId: folder.id, now: 4 });

    state = workspaceReducer(state, { type: 'folder/create', folder });
    state = workspaceReducer(state, { type: 'chat/create', chat });
    state = workspaceReducer(state, { type: 'note/create', note });
    state = workspaceReducer(state, { type: 'note/link-chat', noteId: note.id, chatId: chat.id, now: 5 });
    state = workspaceReducer(state, {
      type: 'tab/open',
      tab: { id: 'tab-chat-mvcc', kind: 'chat', entityId: chat.id, title: chat.label, pinned: false },
      now: 6,
    });

    expect(state.folders).toEqual([folder]);
    expect(state.chatRefs).toEqual([chat]);
    expect(state.notes[0]?.linkedChatIds).toEqual([chat.id]);
    expect(state.activeTabId).toBe('tab-chat-mvcc');
    expect(state.updatedAt).toBe(6);
  });

  it('reparents children and local entities instead of deleting data when a folder is removed', () => {
    let state = createInitialWorkspace(1);
    const parent = createFolder({ id: 'folder-parent', name: 'Backend', parentId: null, now: 2 });
    const child = createFolder({ id: 'folder-child', name: 'Database', parentId: parent.id, now: 3 });
    const chat = createChatReference({
      id: 'chat-1',
      label: 'Transactions',
      target: 'https://chatgpt.com/c/transaction',
      folderId: parent.id,
      now: 4,
    });
    const note = createLocalNote({ id: 'note-1', title: 'Isolation', folderId: parent.id, now: 5 });

    state = workspaceReducer(state, { type: 'folder/create', folder: parent });
    state = workspaceReducer(state, { type: 'folder/create', folder: child });
    state = workspaceReducer(state, { type: 'chat/create', chat });
    state = workspaceReducer(state, { type: 'note/create', note });
    state = workspaceReducer(state, { type: 'folder/delete', folderId: parent.id, now: 6 });

    expect(state.folders).toEqual([{ ...child, parentId: null, updatedAt: 6 }]);
    expect(state.chatRefs[0]?.folderId).toBeNull();
    expect(state.notes[0]?.folderId).toBeNull();
  });

  it('rejects folder moves that would create cycles at the domain boundary', () => {
    let state = createInitialWorkspace(1);
    const parent = createFolder({ id: 'folder-parent', name: 'Backend', parentId: null, now: 2 });
    const child = createFolder({ id: 'folder-child', name: 'Database', parentId: parent.id, now: 3 });
    state = workspaceReducer(state, { type: 'folder/create', folder: parent });
    state = workspaceReducer(state, { type: 'folder/create', folder: child });

    const unchanged = workspaceReducer(state, {
      type: 'folder/update',
      folder: { ...parent, parentId: child.id },
      now: 4,
    });

    expect(unchanged).toBe(state);
    expect(unchanged.folders.find((folder) => folder.id === parent.id)?.parentId).toBeNull();
  });

  it('rejects local entities that point at missing folders', () => {
    const state = createInitialWorkspace(1);
    const chat = createChatReference({
      id: 'chat-orphan',
      label: 'Orphan',
      target: 'https://chatgpt.com/c/orphan',
      folderId: 'missing-folder',
      now: 2,
    });
    const note = createLocalNote({ id: 'note-orphan', title: 'Orphan', folderId: 'missing-folder', now: 2 });

    expect(workspaceReducer(state, { type: 'chat/create', chat })).toBe(state);
    expect(workspaceReducer(state, { type: 'note/create', note })).toBe(state);
  });
});
