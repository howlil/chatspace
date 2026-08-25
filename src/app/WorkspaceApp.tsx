import { useEffect, useMemo, useReducer, useState } from 'react';

import { projectWorkspaceGraph, type GraphNode } from '../domain/graph/projectGraph';
import { exportWorkspaceJson, importWorkspaceJson } from '../domain/workspace/io';
import {
  createChatReference,
  createEntityId,
  createFolder,
  createInitialWorkspace,
  createLocalNote,
  type ChatReference,
  type LocalNote,
  type WorkspaceFolder,
  type WorkspaceTab,
} from '../domain/workspace/model';
import { workspaceReducer } from '../domain/workspace/workspaceReducer';
import { CommandPalette, type WorkspaceCommand } from '../features/command-palette/CommandPalette';
import { GraphNavigator } from '../features/graph/GraphNavigator';
import '../features/graph/graph.css';
import { RelatedNotesPanel } from '../features/local-relations/RelatedNotesPanel';
import '../features/local-relations/local-relations.css';
import { LocalNoteEditor } from '../features/local-notes/LocalNoteEditor';
import '../features/local-notes/local-notes.css';
import { ObsidianBridgePanel, type BridgeConnectionState } from '../features/obsidian-bridge/ObsidianBridgePanel';
import '../features/obsidian-bridge/obsidian-bridge.css';
import { SettingsPanel } from '../features/settings/SettingsPanel';
import '../features/settings/settings.css';
import { WorkspaceTabs } from '../features/tabs/WorkspaceTabs';
import { SpatialWorkspace } from '../features/workspace-layout/SpatialWorkspace';
import { WorkspaceTree } from '../features/workspace-tree/WorkspaceTree';
import { HttpLocalVaultBridge, type LocalVaultBridge } from '../integrations/obsidian/bridge';
import { requestLocalBridgePermission } from '../integrations/obsidian/permission';
import { createDefaultWorkspaceRepository } from '../persistence/chromeStorageWorkspaceRepository';
import type { WorkspaceRepository } from '../persistence/workspaceRepository';
import { getChatGptCapability, navigateToChatGptTarget } from '../providers/chatgpt/adapter';

interface WorkspaceAppProps {
  repository?: WorkspaceRepository;
  currentUrl?: () => string;
  navigate?: (url: string) => void;
  downloadText?: (filename: string, content: string) => void;
  bridge?: LocalVaultBridge;
  requestBridgePermission?: () => Promise<boolean>;
}

type PersistenceState = 'loading' | 'ready' | 'blocked';

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'Local operation failed.';
}

function recoveryText(raw: unknown | null): string | null {
  if (raw === null) return null;
  try { return JSON.stringify(raw, null, 2); } catch { return String(raw); }
}

function defaultDownloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function WorkspaceApp({
  repository,
  currentUrl = () => window.location.href,
  navigate = (url) => window.location.assign(url),
  downloadText = defaultDownloadText,
  bridge,
  requestBridgePermission = requestLocalBridgePermission,
}: WorkspaceAppProps) {
  const workspaceRepository = useMemo(() => repository ?? createDefaultWorkspaceRepository(), [repository]);
  const vaultBridge = useMemo(() => bridge ?? new HttpLocalVaultBridge(), [bridge]);
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, () => createInitialWorkspace());
  const [persistenceState, setPersistenceState] = useState<PersistenceState>('loading');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [recoveryJson, setRecoveryJson] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [status, setStatus] = useState('Local workspace ready.');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [bridgeState, setBridgeState] = useState<BridgeConnectionState>('disconnected');
  const [bridgeMessage, setBridgeMessage] = useState<string | null>(null);
  const [bridgeToken, setBridgeToken] = useState<string | null>(null);
  const graph = useMemo(() => projectWorkspaceGraph(workspace), [workspace]);
  const exportJson = useMemo(() => exportWorkspaceJson(workspace), [workspace]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const saved = await workspaceRepository.load();
        if (cancelled) return;
        if (saved !== null) dispatch({ type: 'workspace/replace', snapshot: saved });
        setPersistenceState('ready');
      } catch (error) {
        if (cancelled) return;
        let raw: unknown | null = null;
        try { raw = await workspaceRepository.readRaw(); } catch { raw = null; }
        setRecoveryJson(recoveryText(raw));
        setPersistenceError(`Storage recovery required. ${messageFromError(error)}`);
        setPersistenceState('blocked');
      }
    })();
    return () => { cancelled = true; };
  }, [workspaceRepository]);

  useEffect(() => {
    if (persistenceState !== 'ready') return;
    void workspaceRepository.save(workspace).catch(async (error) => {
      let raw: unknown | null = null;
      try { raw = await workspaceRepository.readRaw(); } catch { raw = null; }
      setRecoveryJson(recoveryText(raw));
      setPersistenceError(`Saving was blocked. ${messageFromError(error)}`);
      setPersistenceState('blocked');
    });
  }, [persistenceState, workspace, workspaceRepository]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function openTab(tab: WorkspaceTab): void {
    dispatch({ type: 'tab/open', tab, now: Date.now() });
  }

  function chatTab(chat: ChatReference): WorkspaceTab {
    return { id: `tab-chat-${chat.id}`, kind: 'chat', entityId: chat.id, title: chat.label, pinned: false };
  }

  function noteTab(note: LocalNote): WorkspaceTab {
    return { id: `tab-note-${note.id}`, kind: 'note', entityId: note.id, title: note.title, pinned: false };
  }

  function updateLayout(next: Partial<typeof workspace.layout>): void {
    dispatch({ type: 'layout/update', layout: { ...workspace.layout, ...next }, now: Date.now() });
  }

  function addFolder(): void {
    const now = Date.now();
    const folder = createFolder({ id: createEntityId('folder'), name: 'New folder', parentId: selectedFolderId, now });
    dispatch({ type: 'folder/create', folder });
    setSelectedFolderId(folder.id);
    setStatus('Folder created locally.');
  }

  function renameFolder(folder: WorkspaceFolder): void {
    const nextName = window.prompt('Rename folder', folder.name);
    if (nextName === null || nextName.trim() === '') return;
    dispatch({ type: 'folder/update', folder: { ...folder, name: nextName.trim() }, now: Date.now() });
  }

  function deleteFolder(folder: WorkspaceFolder): void {
    if (!window.confirm(`Delete folder “${folder.name}”? Its children will move to the parent folder.`)) return;
    dispatch({ type: 'folder/delete', folderId: folder.id, now: Date.now() });
    if (selectedFolderId === folder.id) setSelectedFolderId(folder.parentId);
  }

  function addNote(): void {
    const now = Date.now();
    const note = createLocalNote({ id: createEntityId('note'), title: 'Untitled note', folderId: selectedFolderId, now });
    dispatch({ type: 'note/create', note });
    dispatch({ type: 'tab/open', tab: noteTab(note), now });
    setStatus('Note created locally.');
  }

  function saveCurrentChat(): void {
    const capability = getChatGptCapability(currentUrl());
    if (capability.currentTarget === null) {
      setStatus('Open a ChatGPT conversation before saving a reference.');
      return;
    }
    const existing = workspace.chatRefs.find((chat) => chat.target === capability.currentTarget);
    if (existing !== undefined) {
      openTab(chatTab(existing));
      setStatus('Conversation reference is already saved.');
      return;
    }
    const now = Date.now();
    const chat = createChatReference({ id: createEntityId('chat'), label: `Conversation ${workspace.chatRefs.length + 1}`, target: capability.currentTarget, folderId: selectedFolderId, now });
    dispatch({ type: 'chat/create', chat });
    dispatch({ type: 'tab/open', tab: chatTab(chat), now });
    setStatus('Conversation reference saved locally.');
  }

  function togglePinChat(chat: ChatReference): void {
    dispatch({ type: 'chat/update', chat: { ...chat, pinned: !chat.pinned }, now: Date.now() });
  }

  function openSavedChat(chat: ChatReference): void {
    openTab(chatTab(chat));
    navigateToChatGptTarget(chat.target, navigate);
  }

  function openNote(note: LocalNote): void { openTab(noteTab(note)); }
  function openGraph(): void { openTab({ id: 'tab-graph', kind: 'graph', entityId: null, title: 'Graph', pinned: false }); }
  function openSettings(): void { openTab({ id: 'tab-settings', kind: 'settings', entityId: null, title: 'Settings', pinned: false }); }
  function openHome(): void { dispatch({ type: 'tab/activate', tabId: 'tab-home', now: Date.now() }); }

  function openGraphNode(node: GraphNode): void {
    if (node.kind === 'chat') {
      const chat = workspace.chatRefs.find((item) => item.id === node.entityId);
      if (chat !== undefined) openSavedChat(chat);
      return;
    }
    if (node.kind === 'note') {
      const note = workspace.notes.find((item) => item.id === node.entityId);
      if (note !== undefined) openNote(note);
      return;
    }
    if (node.kind === 'folder') {
      setSelectedFolderId(node.entityId);
      openHome();
      return;
    }
    openHome();
  }

  function createManualEdge(sourceEntityId: string, targetEntityId: string): void {
    const now = Date.now();
    dispatch({ type: 'edge/create', edge: { id: createEntityId('edge'), sourceEntityId, targetEntityId, kind: 'related-manually', createdAt: now }, now });
  }

  async function importBackup(json: string): Promise<void> {
    const snapshot = importWorkspaceJson(json);
    try {
      await workspaceRepository.save(snapshot);
      dispatch({ type: 'workspace/replace', snapshot });
      setPersistenceError(null);
      setRecoveryJson(null);
      setPersistenceState('ready');
      setStatus('Backup imported.');
    } catch (error) {
      setPersistenceError(`Import could not be saved. ${messageFromError(error)}`);
      setPersistenceState('blocked');
      throw error;
    }
  }

  async function resetLocalData(): Promise<void> {
    try {
      await workspaceRepository.clear();
      const reset = createInitialWorkspace();
      dispatch({ type: 'workspace/replace', snapshot: reset });
      setSelectedFolderId(null);
      setPersistenceError(null);
      setRecoveryJson(null);
      setPersistenceState('ready');
      setStatus('Local workspace reset.');
    } catch (error) {
      setPersistenceError(`Reset failed. ${messageFromError(error)}`);
      setPersistenceState('blocked');
      throw error;
    }
  }

  async function connectBridge(token: string): Promise<void> {
    setBridgeState('connecting');
    setBridgeMessage(null);
    try {
      const granted = await requestBridgePermission();
      if (!granted) throw new Error('Localhost bridge permission was not granted.');
      await vaultBridge.health(token);
      setBridgeToken(token);
      setBridgeState('connected');
      setBridgeMessage(null);
    } catch (error) {
      setBridgeToken(null);
      setBridgeState('error');
      setBridgeMessage(messageFromError(error));
      throw error;
    }
  }

  function disconnectBridge(): void {
    setBridgeToken(null);
    setBridgeState('disconnected');
    setBridgeMessage(null);
  }

  async function syncNoteToVault(note: LocalNote): Promise<void> {
    if (bridgeToken === null) {
      setBridgeMessage('Connect the local vault bridge before syncing a note.');
      openSettings();
      return;
    }
    try {
      const result = await vaultBridge.writeNote(bridgeToken, note);
      setStatus(`Synced note to ${result.path}.`);
      setBridgeMessage(null);
    } catch (error) {
      setBridgeState('error');
      setBridgeMessage(messageFromError(error));
    }
  }

  const activeTab = workspace.tabs.find((tab) => tab.id === workspace.activeTabId) ?? workspace.tabs[0];
  const activeChat = activeTab?.kind === 'chat' ? workspace.chatRefs.find((chat) => chat.id === activeTab.entityId) : undefined;
  const activeNote = activeTab?.kind === 'note' ? workspace.notes.find((note) => note.id === activeTab.entityId) : undefined;
  const capability = getChatGptCapability(currentUrl());
  const compatibilityLabel = capability.canCaptureCurrentReference ? 'Conversation detected' : capability.supportedOrigin ? 'ChatGPT detected' : 'Open ChatGPT';

  const commands: WorkspaceCommand[] = [
    { id: 'explorer-toggle', label: workspace.layout.treeCollapsed ? 'Show explorer' : 'Hide explorer', run: () => updateLayout({ treeCollapsed: !workspace.layout.treeCollapsed }) },
    { id: 'folder-create', label: 'Create folder', run: addFolder },
    { id: 'note-create', label: 'Create note', run: addNote },
    { id: 'chat-save', label: 'Save current chat', run: saveCurrentChat },
    { id: 'graph-open', label: 'Open graph', run: openGraph },
    { id: 'settings-open', label: 'Open settings', run: openSettings },
    { id: 'home-open', label: 'Open home', run: openHome },
  ];

  let surfaceContent;
  if (activeTab?.kind === 'settings') {
    surfaceContent = <><SettingsPanel exportJson={exportJson} recoveryJson={recoveryJson} persistenceError={persistenceError} onImport={importBackup} onReset={resetLocalData} onDownload={downloadText}/><ObsidianBridgePanel state={bridgeState} message={bridgeMessage} onConnect={connectBridge} onDisconnect={disconnectBridge}/></>;
  } else if (activeTab?.kind === 'graph') {
    surfaceContent = <GraphNavigator graph={graph} onOpenNode={openGraphNode} onCreateManualEdge={createManualEdge}/>;
  } else if (activeNote !== undefined) {
    surfaceContent = <div><LocalNoteEditor note={activeNote} chats={workspace.chatRefs} onChange={(note)=>dispatch({type:'note/update',note,now:Date.now()})} onLinkChat={(chatId)=>dispatch({type:'note/link-chat',noteId:activeNote.id,chatId,now:Date.now()})}/><RelatedNotesPanel noteId={activeNote.id} notes={workspace.notes} onOpenNote={openNote}/><div className="note-bridge-actions"><button type="button" onClick={()=>void syncNoteToVault(activeNote)}>Sync to local vault</button><span>{bridgeState==='connected'?'Bridge connected':'Bridge disconnected'}</span></div></div>;
  } else if (activeChat !== undefined) {
    surfaceContent = <section className="workspace-home"><strong>{activeChat.label}</strong><p>{activeChat.target}</p><button type="button" onClick={()=>openSavedChat(activeChat)}>Open in ChatGPT</button></section>;
  } else {
    surfaceContent = <section className="workspace-home"><strong>{workspace.name}</strong><p>{status}</p><dl className="workspace-stats"><div><dt>Folders</dt><dd>{workspace.folders.length}</dd></div><div><dt>Chats</dt><dd>{workspace.chatRefs.length}</dd></div><div><dt>Notes</dt><dd>{workspace.notes.length}</dd></div></dl></section>;
  }

  const surface = (
    <div className="workspace-surface-stack">
      <div className="workbench-chrome">
        <button className="explorer-toggle" type="button" aria-label="Toggle explorer" onClick={() => updateLayout({ treeCollapsed: !workspace.layout.treeCollapsed })}>☰</button>
        <WorkspaceTabs tabs={workspace.tabs} activeTabId={workspace.activeTabId} onActivate={(tabId)=>dispatch({type:'tab/activate',tabId,now:Date.now()})} onClose={(tabId)=>dispatch({type:'tab/close',tabId,now:Date.now()})}/>
        <div className="provider-presence" data-supported={capability.supportedOrigin ? 'true' : 'false'} title="Native ChatGPT stays in the main browser page">
          <span className="compatibility-dot" aria-hidden="true"/><span>{compatibilityLabel}</span>
        </div>
      </div>
      {persistenceError !== null && <div className="provider-storage-warning" role="alert"><span>{persistenceError}</span><button type="button" onClick={openSettings}>Recover</button></div>}
      {surfaceContent}
    </div>
  );

  const tree = (
    <div className="workspace-explorer">
      <div className="tree-toolbar">
        <div><button type="button" onClick={addFolder}>New folder</button><button type="button" onClick={addNote}>New note</button></div>
        <button type="button" onClick={saveCurrentChat}>Save current chat</button>
      </div>
      <WorkspaceTree
        folders={workspace.folders}
        chatRefs={workspace.chatRefs}
        notes={workspace.notes}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onToggleFolder={(folderId) => dispatch({ type: 'folder/toggle', folderId, now: Date.now() })}
        onRenameFolder={renameFolder}
        onDeleteFolder={deleteFolder}
        onOpenChat={openSavedChat}
        onOpenNote={openNote}
        onTogglePinChat={togglePinChat}
      />
    </div>
  );

  return <><SpatialWorkspace tree={tree} surface={surface} treeCollapsed={workspace.layout.treeCollapsed} treeWidth={workspace.layout.treeWidth} onTreeWidthChange={(treeWidth) => updateLayout({ treeWidth })}/>{paletteOpen&&<CommandPalette commands={commands} onClose={()=>setPaletteOpen(false)}/>}</>;
}
