import { describe, expect, it } from 'vitest';

import {
  INBOX_FOLDER_ID,
  createChatReference,
  createFolder,
  createInitialWorkspace,
  createLocalNote,
  type SavedKnowledgeView,
} from './model';
import { workspaceReducer } from './workspaceReducer';

function userFolders(state: ReturnType<typeof createInitialWorkspace>) {
  return state.folders.filter((folder) => folder.id !== INBOX_FOLDER_ID);
}

describe('workspaceReducer', () => {
  it('keeps folders, chat references, notes, and tabs in one canonical snapshot', () => {
    let state = createInitialWorkspace(1);
    const folder = createFolder({ id: 'folder-db', name: 'Database', parentId: null, now: 2 });
    const chat = createChatReference({ id: 'chat-mvcc', label: 'PostgreSQL MVCC', target: 'https://chatgpt.com/c/abc-123', folderId: folder.id, now: 3 });
    const note = createLocalNote({ id: 'note-mvcc', title: 'MVCC notes', folderId: folder.id, now: 4 });

    state = workspaceReducer(state, { type: 'folder/create', folder });
    state = workspaceReducer(state, { type: 'chat/create', chat });
    state = workspaceReducer(state, { type: 'note/create', note });
    state = workspaceReducer(state, { type: 'note/link-chat', noteId: note.id, chatId: chat.id, now: 5 });
    state = workspaceReducer(state, { type: 'tab/open', tab: { id: 'tab-chat-mvcc', kind: 'chat', entityId: chat.id, title: chat.label, pinned: false }, now: 6 });

    expect(state.folders.find((item) => item.id === INBOX_FOLDER_ID)?.name).toBe('Inbox');
    expect(userFolders(state)).toEqual([folder]);
    expect(state.chatRefs).toEqual([chat]);
    expect(state.notes[0]?.linkedChatIds).toEqual([chat.id]);
    expect(state.activeTabId).toBe('tab-chat-mvcc');
    expect(state.updatedAt).toBe(6);
  });

  it('persists saved view definitions and removes their open tabs without touching notes', () => {
    let state = createInitialWorkspace(1);
    const note = { ...createLocalNote({ id: 'note-research', title: 'Research', folderId: null, now: 2 }), properties: { status: 'research' } };
    const view: SavedKnowledgeView = {
      id: 'view-research',
      name: 'Research',
      filters: [{ property: 'status', value: 'research' }],
      createdAt: 3,
      updatedAt: 3,
    };
    state = workspaceReducer(state, { type: 'note/create', note });
    state = workspaceReducer(state, { type: 'view/create', view });
    state = workspaceReducer(state, { type: 'tab/open', tab: { id: 'tab-view-research', kind: 'view', entityId: view.id, title: view.name, pinned: false }, now: 4 });

    expect(state.savedViews).toEqual([view]);
    expect(state.activeTabId).toBe('tab-view-research');

    state = workspaceReducer(state, { type: 'view/delete', viewId: view.id, now: 5 });
    expect(state.savedViews).toEqual([]);
    expect(state.tabs.some((tab) => tab.entityId === view.id)).toBe(false);
    expect(state.notes).toEqual([note]);
    expect(state.activeTabId).toBe('tab-home');
  });

  it('reparents children and local entities instead of deleting data when a folder is removed', () => {
    let state = createInitialWorkspace(1);
    const parent = createFolder({ id: 'folder-parent', name: 'Backend', parentId: null, now: 2 });
    const child = createFolder({ id: 'folder-child', name: 'Database', parentId: parent.id, now: 3 });
    const chat = createChatReference({ id: 'chat-1', label: 'Transactions', target: 'https://chatgpt.com/c/transaction', folderId: parent.id, now: 4 });
    const note = createLocalNote({ id: 'note-1', title: 'Isolation', folderId: parent.id, now: 5 });

    state = workspaceReducer(state, { type: 'folder/create', folder: parent });
    state = workspaceReducer(state, { type: 'folder/create', folder: child });
    state = workspaceReducer(state, { type: 'chat/create', chat });
    state = workspaceReducer(state, { type: 'note/create', note });
    state = workspaceReducer(state, { type: 'folder/delete', folderId: parent.id, now: 6 });

    expect(userFolders(state)).toEqual([{ ...child, parentId: null, updatedAt: 6 }]);
    expect(state.chatRefs[0]?.folderId).toBeNull();
    expect(state.notes[0]?.folderId).toBeNull();
  });

  it('keeps Inbox at the root and rejects rename/delete/nesting changes', () => {
    const state = createInitialWorkspace(1);
    const inbox = state.folders.find((folder) => folder.id === INBOX_FOLDER_ID)!;
    expect(workspaceReducer(state, { type: 'folder/delete', folderId: INBOX_FOLDER_ID, now: 2 })).toBe(state);
    expect(workspaceReducer(state, { type: 'folder/update', folder: { ...inbox, name: 'Other' }, now: 2 })).toBe(state);
    const child = createFolder({ id: 'child', name: 'Child', parentId: INBOX_FOLDER_ID, now: 2 });
    expect(workspaceReducer(state, { type: 'folder/create', folder: child })).toBe(state);
  });

  it('renames a note and rewrites uniquely resolved inbound wikilinks in one transition', () => {
    let state = createInitialWorkspace(1);
    const target = { ...createLocalNote({ id: 'target', title: 'Persistence model', folderId: null, now: 2 }), content: 'Target' };
    const source = { ...createLocalNote({ id: 'source', title: 'Architecture', folderId: null, now: 3 }), content: 'See [[Persistence model]] and [[Persistence model|storage]].' };
    state = workspaceReducer(state, { type: 'note/create', note: target });
    state = workspaceReducer(state, { type: 'note/create', note: source });
    state = workspaceReducer(state, { type: 'tab/open', tab: { id: 'tab-note-target', kind: 'note', entityId: target.id, title: target.title, pinned: false }, now: 4 });

    state = workspaceReducer(state, { type: 'note/update', note: { ...target, title: 'Storage model' }, now: 5 });

    expect(state.notes.find((note) => note.id === target.id)?.title).toBe('Storage model');
    expect(state.notes.find((note) => note.id === source.id)?.content).toBe('See [[Storage model]] and [[Storage model|storage]].');
    expect(state.tabs.find((tab) => tab.id === 'tab-note-target')?.title).toBe('Storage model');
    expect(state.updatedAt).toBe(5);
  });

  it('rejects folder moves that would create cycles at the domain boundary', () => {
    let state = createInitialWorkspace(1);
    const parent = createFolder({ id: 'folder-parent', name: 'Backend', parentId: null, now: 2 });
    const child = createFolder({ id: 'folder-child', name: 'Database', parentId: parent.id, now: 3 });
    state = workspaceReducer(state, { type: 'folder/create', folder: parent });
    state = workspaceReducer(state, { type: 'folder/create', folder: child });

    const unchanged = workspaceReducer(state, { type: 'folder/update', folder: { ...parent, parentId: child.id }, now: 4 });

    expect(unchanged).toBe(state);
    expect(unchanged.folders.find((folder) => folder.id === parent.id)?.parentId).toBeNull();
  });

  it('rejects local entities that point at missing folders', () => {
    const state = createInitialWorkspace(1);
    const chat = createChatReference({ id: 'chat-orphan', label: 'Orphan', target: 'https://chatgpt.com/c/orphan', folderId: 'missing-folder', now: 2 });
    const note = createLocalNote({ id: 'note-orphan', title: 'Orphan', folderId: 'missing-folder', now: 2 });

    expect(workspaceReducer(state, { type: 'chat/create', chat })).toBe(state);
    expect(workspaceReducer(state, { type: 'note/create', note })).toBe(state);
  });
});