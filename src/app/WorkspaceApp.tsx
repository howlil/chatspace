import { useEffect, useMemo, useReducer, useState } from 'react';

import {
  createChatReference,
  createEntityId,
  createFolder,
  createInitialWorkspace,
  type WorkspaceSnapshot,
} from '../domain/workspace/model';
import { workspaceReducer } from '../domain/workspace/workspaceReducer';
import { SpatialWorkspace } from '../features/workspace-layout/SpatialWorkspace';
import { WorkspaceTree } from '../features/workspace-tree/WorkspaceTree';
import { createDefaultWorkspaceRepository } from '../persistence/chromeStorageWorkspaceRepository';
import type { WorkspaceRepository } from '../persistence/workspaceRepository';
import { getChatGptCapability } from '../providers/chatgpt/adapter';

interface WorkspaceAppProps {
  repository?: WorkspaceRepository;
  currentUrl?: () => string;
}

export function WorkspaceApp({
  repository,
  currentUrl = () => window.location.href,
}: WorkspaceAppProps) {
  const workspaceRepository = useMemo(
    () => repository ?? createDefaultWorkspaceRepository(),
    [repository],
  );
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, () => createInitialWorkspace());
  const [hydrated, setHydrated] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [status, setStatus] = useState('Local workspace ready.');

  useEffect(() => {
    let cancelled = false;
    void workspaceRepository.load().then((saved) => {
      if (!cancelled && saved !== null) {
        dispatch({ type: 'workspace/replace', snapshot: saved });
      }
      if (!cancelled) {
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [workspaceRepository]);

  useEffect(() => {
    if (hydrated) {
      void workspaceRepository.save(workspace);
    }
  }, [hydrated, workspace, workspaceRepository]);

  function addFolder() {
    const now = Date.now();
    const folder = createFolder({
      id: createEntityId('folder'),
      name: 'New folder',
      parentId: selectedFolderId,
      now,
    });
    dispatch({ type: 'folder/create', folder });
    setSelectedFolderId(folder.id);
    setStatus('Folder created locally.');
  }

  function saveCurrentChat() {
    const capability = getChatGptCapability(currentUrl());
    if (capability.currentTarget === null) {
      setStatus('Open a ChatGPT conversation before saving a reference.');
      return;
    }

    const existing = workspace.chatRefs.find((chat) => chat.target === capability.currentTarget);
    if (existing !== undefined) {
      setStatus('Conversation reference is already saved.');
      return;
    }

    const now = Date.now();
    const chat = createChatReference({
      id: createEntityId('chat'),
      label: `Conversation ${workspace.chatRefs.length + 1}`,
      target: capability.currentTarget,
      folderId: selectedFolderId,
      now,
    });
    dispatch({ type: 'chat/create', chat });
    setStatus('Conversation reference saved locally.');
  }

  const tree = (
    <>
      <div className="tree-toolbar">
        <button type="button" onClick={addFolder}>New folder</button>
        <button type="button" onClick={saveCurrentChat}>Save current chat</button>
      </div>
      <WorkspaceTree
        folders={workspace.folders}
        chatRefs={workspace.chatRefs}
        notes={workspace.notes}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
      />
    </>
  );

  const surface = (
    <section className="workspace-home">
      <strong>{workspace.name}</strong>
      <p>{status}</p>
      <dl className="workspace-stats">
        <div><dt>Folders</dt><dd>{workspace.folders.length}</dd></div>
        <div><dt>Chats</dt><dd>{workspace.chatRefs.length}</dd></div>
        <div><dt>Notes</dt><dd>{workspace.notes.length}</dd></div>
      </dl>
    </section>
  );

  return (
    <SpatialWorkspace
      tree={tree}
      surface={surface}
      provider={<p className="panel-empty">ChatGPT stays native on the host page.</p>}
    />
  );
}

export type { WorkspaceSnapshot };
