import { describe, expect, it } from 'vitest';

import {
  createChatReference,
  createFolder,
  createInitialWorkspace,
  createLocalNote,
} from '../workspace/model';
import { workspaceReducer } from '../workspace/workspaceReducer';
import { projectWorkspaceGraph } from './projectGraph';

describe('projectWorkspaceGraph', () => {
  it('projects canonical workspace entities and provenanced relationships without becoming source of truth', () => {
    let snapshot = createInitialWorkspace(1);
    const folder = createFolder({ id: 'folder-swe', name: 'Software Engineering', parentId: null, now: 2 });
    const chat = createChatReference({
      id: 'chat-tcp',
      label: 'TCP retries',
      target: 'https://chatgpt.com/c/tcp',
      folderId: folder.id,
      now: 3,
    });
    const note = { ...createLocalNote({ id: 'note-idempotency', title: 'Idempotency', folderId: folder.id, now: 4 }), linkedChatIds: [chat.id] };

    snapshot = workspaceReducer(snapshot, { type: 'folder/create', folder });
    snapshot = workspaceReducer(snapshot, { type: 'chat/create', chat });
    snapshot = workspaceReducer(snapshot, { type: 'note/create', note });

    const graph = projectWorkspaceGraph(snapshot);

    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(['workspace:default', 'folder:folder-swe', 'chat:chat-tcp', 'note:note-idempotency']),
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: 'workspace:default', targetId: 'folder:folder-swe', kind: 'contains', provenance: 'canonical' }),
        expect.objectContaining({ sourceId: 'note:note-idempotency', targetId: 'chat:chat-tcp', kind: 'references', provenance: 'canonical' }),
      ]),
    );
  });
});
