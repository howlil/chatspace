import { describe, expect, it } from 'vitest';

import { createChatReference, createFolder, createInitialWorkspace, createLocalNote } from './model';
import { workspaceReducer } from './workspaceReducer';

describe('workspace bulk artifact actions', () => {
  function populatedWorkspace() {
    let state = createInitialWorkspace(1);
    const folder = createFolder({ id: 'folder-1', name: 'Research', parentId: null, now: 2 });
    const chat = createChatReference({ id: 'chat-1', label: 'Architecture', target: 'https://chatgpt.com/c/1', folderId: null, now: 3 });
    const note = { ...createLocalNote({ id: 'note-1', title: 'Notes', folderId: null, now: 4 }), linkedChatIds: [chat.id] };
    state = workspaceReducer(state, { type: 'folder/create', folder });
    state = workspaceReducer(state, { type: 'chat/create', chat });
    state = workspaceReducer(state, { type: 'note/create', note });
    state = workspaceReducer(state, {
      type: 'edge/create',
      edge: { id: 'edge-1', sourceEntityId: note.id, targetEntityId: chat.id, kind: 'related-manually', createdAt: 5 },
      now: 5,
    });
    state = workspaceReducer(state, { type: 'tab/open', tab: { id: 'tab-note', kind: 'note', entityId: note.id, title: note.title, pinned: false }, now: 6 });
    return { state, folder, chat, note };
  }

  it('moves mixed note and chat selections in one transition', () => {
    const { state, folder, chat, note } = populatedWorkspace();
    const next = workspaceReducer(state, {
      type: 'artifact/bulk-move',
      refs: [{ kind: 'chat', id: chat.id }, { kind: 'note', id: note.id }],
      folderId: folder.id,
      now: 10,
    });

    expect(next.chatRefs[0]?.folderId).toBe(folder.id);
    expect(next.notes[0]?.folderId).toBe(folder.id);
    expect(next.updatedAt).toBe(10);
  });

  it('archives and restores without deleting local content or relationships', () => {
    const { state, chat, note } = populatedWorkspace();
    const refs = [{ kind: 'chat' as const, id: chat.id }, { kind: 'note' as const, id: note.id }];
    const archived = workspaceReducer(state, { type: 'artifact/bulk-archive', refs, archivedAt: 10, now: 10 });

    expect(archived.chatRefs[0]?.archivedAt).toBe(10);
    expect(archived.notes[0]?.archivedAt).toBe(10);
    expect(archived.notes[0]?.content).toBe(note.content);
    expect(archived.notes[0]?.linkedChatIds).toEqual([chat.id]);
    expect(archived.manualEdges).toHaveLength(1);
    expect(archived.tabs.some((tab) => tab.entityId === note.id)).toBe(false);

    const restored = workspaceReducer(archived, { type: 'artifact/bulk-archive', refs, archivedAt: null, now: 11 });
    expect(restored.chatRefs[0]?.archivedAt).toBeNull();
    expect(restored.notes[0]?.archivedAt).toBeNull();
    expect(restored.notes[0]?.folderId).toBeNull();
  });

  it('deletes a mixed selection and cleans owned references and manual edges atomically', () => {
    const { state, chat, note } = populatedWorkspace();
    const next = workspaceReducer(state, {
      type: 'artifact/bulk-delete',
      refs: [{ kind: 'chat', id: chat.id }, { kind: 'note', id: note.id }],
      now: 12,
    });

    expect(next.chatRefs).toEqual([]);
    expect(next.notes).toEqual([]);
    expect(next.manualEdges).toEqual([]);
    expect(next.tabs.some((tab) => tab.entityId === chat.id || tab.entityId === note.id)).toBe(false);
    expect(next.updatedAt).toBe(12);
  });
});
