import { describe, expect, it } from 'vitest';

import { createChatReference, createFolder, createInitialWorkspace } from './model';
import { exportWorkspaceJson, importWorkspaceJson } from './io';

describe('workspace import/export', () => {
  it('round-trips a valid local workspace snapshot', () => {
    const snapshot = createInitialWorkspace(42);
    const restored = importWorkspaceJson(exportWorkspaceJson(snapshot));
    expect(restored).toEqual(snapshot);
  });

  it('rejects unknown schema versions and malformed payloads', () => {
    expect(() => importWorkspaceJson('{"schemaVersion":999}')).toThrow(/unsupported/i);
    expect(() => importWorkspaceJson('{"schemaVersion":1,"folders":"wrong"}')).toThrow(/invalid/i);
  });

  it('rejects structurally valid snapshots with cyclic or dangling workspace references', () => {
    const cyclic = createInitialWorkspace(1);
    cyclic.folders = [
      createFolder({ id: 'folder-a', name: 'A', parentId: 'folder-b', now: 1 }),
      createFolder({ id: 'folder-b', name: 'B', parentId: 'folder-a', now: 1 }),
    ];
    expect(() => importWorkspaceJson(exportWorkspaceJson(cyclic))).toThrow(/invalid/i);

    const dangling = createInitialWorkspace(1);
    dangling.chatRefs = [
      createChatReference({
        id: 'chat-a',
        label: 'Dangling',
        target: 'https://chatgpt.com/c/dangling',
        folderId: 'missing-folder',
        now: 1,
      }),
    ];
    expect(() => importWorkspaceJson(exportWorkspaceJson(dangling))).toThrow(/invalid/i);
  });
});
