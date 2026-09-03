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

  it('projects explicit Markdown note links with derived-link provenance', () => {
    const snapshot = createInitialWorkspace(1);
    const source = createLocalNote({ id: 'note-a', title: 'Architecture', folderId: null, now: 2 });
    source.content = 'See [[Storage recovery]].';
    const target = createLocalNote({ id: 'note-b', title: 'Storage recovery', folderId: null, now: 3 });
    snapshot.notes = [source, target];

    const graph = projectWorkspaceGraph(snapshot);

    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceId: 'note:note-a',
        targetId: 'note:note-b',
        kind: 'note-link',
        provenance: 'derived-link',
      }),
    ]));
  });

  it('lets manual relations take precedence over note links and note links over local similarity', () => {
    const snapshot = createInitialWorkspace(1);
    const first = createLocalNote({ id: 'note-a', title: 'Postgres MVCC', folderId: null, now: 2 });
    first.content = 'transactions isolation locking production [[MVCC isolation]]';
    const second = createLocalNote({ id: 'note-b', title: 'MVCC isolation', folderId: null, now: 3 });
    second.content = 'postgres transactions locking behavior';
    snapshot.notes = [first, second];

    const linked = projectWorkspaceGraph(snapshot);
    expect(linked.edges.filter((edge) => edge.sourceId.includes('note-') && edge.targetId.includes('note-'))).toEqual([
      expect.objectContaining({ kind: 'note-link', provenance: 'derived-link' }),
    ]);

    snapshot.manualEdges = [{ id: 'edge-1', sourceEntityId: first.id, targetEntityId: second.id, kind: 'related-manually', createdAt: 4 }];
    const manual = projectWorkspaceGraph(snapshot);
    expect(manual.edges.filter((edge) => edge.sourceId.includes('note-') && edge.targetId.includes('note-'))).toEqual([
      expect.objectContaining({ kind: 'related-manually', provenance: 'manual' }),
    ]);
  });

  it('projects deterministic local relations with derived-local provenance', () => {
    const snapshot = createInitialWorkspace(1);
    const first = createLocalNote({ id: 'note-a', title: 'Postgres MVCC', folderId: null, now: 2 });
    first.content = 'transactions isolation locking production';
    const second = createLocalNote({ id: 'note-b', title: 'MVCC isolation', folderId: null, now: 3 });
    second.content = 'postgres transactions locking behavior';
    snapshot.notes = [first, second];

    const graph = projectWorkspaceGraph(snapshot);

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: 'note:note-a',
          targetId: 'note:note-b',
          kind: 'related-local',
          provenance: 'derived-local',
        }),
      ]),
    );
  });
});
