import { deriveLocalNoteRelations, localRelationPairKey } from './localRelations';
import type { WorkspaceSnapshot } from '../workspace/model';

export type GraphNodeKind = 'workspace' | 'folder' | 'chat' | 'note';
export type GraphEdgeKind = 'contains' | 'references' | 'related-manually' | 'related-local';
export type GraphProvenance = 'canonical' | 'manual' | 'derived-local';

export interface GraphNode {
  id: string;
  entityId: string;
  kind: GraphNodeKind;
  label: string;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  kind: GraphEdgeKind;
  provenance: GraphProvenance;
}

export interface WorkspaceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function nodeId(kind: GraphNodeKind, entityId: string): string {
  return `${kind}:${entityId}`;
}

export function projectWorkspaceGraph(snapshot: WorkspaceSnapshot): WorkspaceGraph {
  const workspaceNodeId = nodeId('workspace', snapshot.id);
  const nodes: GraphNode[] = [
    { id: workspaceNodeId, entityId: snapshot.id, kind: 'workspace', label: snapshot.name },
    ...snapshot.folders.map((folder) => ({
      id: nodeId('folder', folder.id),
      entityId: folder.id,
      kind: 'folder' as const,
      label: folder.name,
    })),
    ...snapshot.chatRefs.map((chat) => ({
      id: nodeId('chat', chat.id),
      entityId: chat.id,
      kind: 'chat' as const,
      label: chat.label,
    })),
    ...snapshot.notes.map((note) => ({
      id: nodeId('note', note.id),
      entityId: note.id,
      kind: 'note' as const,
      label: note.title,
    })),
  ];

  const graphIdByEntityId = new Map(nodes.map((node) => [node.entityId, node.id]));
  const edges: GraphEdge[] = [];

  for (const folder of snapshot.folders) {
    const sourceId = folder.parentId === null ? workspaceNodeId : nodeId('folder', folder.parentId);
    edges.push({
      id: `contains:${sourceId}:${nodeId('folder', folder.id)}`,
      sourceId,
      targetId: nodeId('folder', folder.id),
      kind: 'contains',
      provenance: 'canonical',
    });
  }

  for (const chat of snapshot.chatRefs) {
    const sourceId = chat.folderId === null ? workspaceNodeId : nodeId('folder', chat.folderId);
    edges.push({
      id: `contains:${sourceId}:${nodeId('chat', chat.id)}`,
      sourceId,
      targetId: nodeId('chat', chat.id),
      kind: 'contains',
      provenance: 'canonical',
    });
  }

  for (const note of snapshot.notes) {
    const noteId = nodeId('note', note.id);
    const sourceId = note.folderId === null ? workspaceNodeId : nodeId('folder', note.folderId);
    edges.push({
      id: `contains:${sourceId}:${noteId}`,
      sourceId,
      targetId: noteId,
      kind: 'contains',
      provenance: 'canonical',
    });

    for (const chatId of note.linkedChatIds) {
      if (snapshot.chatRefs.some((chat) => chat.id === chatId)) {
        edges.push({
          id: `references:${noteId}:${nodeId('chat', chatId)}`,
          sourceId: noteId,
          targetId: nodeId('chat', chatId),
          kind: 'references',
          provenance: 'canonical',
        });
      }
    }
  }

  const manualPairs = new Set<string>();
  for (const edge of snapshot.manualEdges) {
    const sourceId = graphIdByEntityId.get(edge.sourceEntityId);
    const targetId = graphIdByEntityId.get(edge.targetEntityId);
    if (sourceId !== undefined && targetId !== undefined) {
      manualPairs.add(localRelationPairKey(edge.sourceEntityId, edge.targetEntityId));
      edges.push({
        id: `manual:${edge.id}`,
        sourceId,
        targetId,
        kind: edge.kind,
        provenance: 'manual',
      });
    }
  }

  for (const relation of deriveLocalNoteRelations(snapshot.notes)) {
    if (manualPairs.has(localRelationPairKey(relation.sourceNoteId, relation.targetNoteId))) continue;
    edges.push({
      id: `local:${relation.sourceNoteId}:${relation.targetNoteId}`,
      sourceId: nodeId('note', relation.sourceNoteId),
      targetId: nodeId('note', relation.targetNoteId),
      kind: 'related-local',
      provenance: 'derived-local',
    });
  }

  return { nodes, edges };
}
