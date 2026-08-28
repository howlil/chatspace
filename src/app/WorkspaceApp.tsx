import { AlertTriangle, BookmarkPlus, FilePlus2, FolderPlus } from 'lucide-react';
import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';

import { projectWorkspaceGraph, type GraphNode } from '../domain/graph/projectGraph';
import { canMoveFolder } from '../domain/workspace/integrity';
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
import { ChatDetails } from '../features/chat-details/ChatDetails';
import { CommandPalette, type WorkspaceCommand } from '../features/command-palette/CommandPalette';
import { GraphNavigator } from '../features/graph/GraphNavigator';
import { DailyHome } from '../features/home/DailyHome';
import { LocalNoteEditor } from '../features/local-notes/LocalNoteEditor';
import { NoteContextRail } from '../features/local-notes/NoteContextRail';
import { ObsidianBridgePanel, type BridgeConnectionState } from '../features/obsidian-bridge/ObsidianBridgePanel';
import { SaveConversationDialog, type SaveConversationInput } from '../features/save-conversation/SaveConversationDialog';
import { SettingsPanel } from '../features/settings/SettingsPanel';
import { WorkbenchChrome } from '../features/workbench/WorkbenchChrome';
import { SpatialWorkspace } from '../features/workspace-layout/SpatialWorkspace';
import { WorkspaceTree } from '../features/workspace-tree/WorkspaceTree';
import type { LocalVaultBridge } from '../integrations/obsidian/bridge';
import type { WorkspaceRepository } from '../persistence/workspaceRepository';
import { getChatGptCapability, navigateToChatGptTarget } from '../providers/chatgpt/adapter';
import { Button } from '../ui/primitives';

interface WorkspaceAppProps {
  repository: WorkspaceRepository;
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
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
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
  repository: workspaceRepository,
  currentUrl = () => window.location.href,
  navigate = (url) => window.location.assign(url),
  downloadText = defaultDownloadText,
  bridge: vaultBridge,
  requestBridgePermission = async () => false,
}: WorkspaceAppProps) {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, () => createInitialWorkspace());
  const [persistenceState, setPersistenceState] = useState<PersistenceState>('loading');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [recoveryJson, setRecoveryJson] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [status, setStatus] = useState('Local workspace ready.');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [saveDialogTarget, setSaveDialogTarget] = useState<string | null>(null);
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
        try {
          raw = await workspaceRepository.readRaw();
        } catch {
          raw = null;
        }
        setRecoveryJson(recoveryText(raw));
        setPersistenceError(`Storage recovery required. ${messageFromError(error)}`);
        setPersistenceState('blocked');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceRepository]);

  useEffect(() => {
    if (persistenceState !== 'ready') return;
    void workspaceRepository.save(workspace).catch(async (error) => {
      let raw: unknown | null = null;
      try {
        raw = await workspaceRepository.readRaw();
      } catch {
        raw = null;
      }
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

  function chatTab(chat: ChatReference): WorkspaceTab {
    return { id: `tab-chat-${chat.id}`, kind: 'chat', entityId: chat.id, title: chat.label, pinned: false };
  }

  function noteTab(note: LocalNote): WorkspaceTab {
    return { id: `tab-note-${note.id}`, kind: 'note', entityId: note.id, title: note.title, pinned: false };
  }

  function openTab(tab: WorkspaceTab): void {
    dispatch({ type: 'tab/open', tab, now: Date.now() });
  }

  function updateLayout(next: Partial<typeof workspace.layout>): void {
    dispatch({ type: 'layout/update', layout: { ...workspace.layout, ...next }, now: Date.now() });
  }

  function addFolder(parentId: string | null = null): void {
    const now = Date.now();
    const folder = createFolder({ id: createEntityId('folder'), name: 'New folder', parentId, now });
    dispatch({ type: 'folder/create', folder });
    setSelectedFolderId(folder.id);
    setStatus(parentId === null ? 'Folder created at workspace root.' : 'Subfolder created.');
  }

  function renameFolder(folder: WorkspaceFolder): void {
    const nextName = window.prompt('Rename folder', folder.name);
    if (nextName === null || nextName.trim() === '') return;
    dispatch({ type: 'folder/update', folder: { ...folder, name: nextName.trim() }, now: Date.now() });
  }

  function moveFolder(folder: WorkspaceFolder, parentId: string | null): void {
    if (!canMoveFolder(workspace.folders, folder.id, parentId)) {
      setStatus('A folder cannot be moved into itself or one of its descendants.');
      return;
    }
    dispatch({ type: 'folder/update', folder: { ...folder, parentId }, now: Date.now() });
    setSelectedFolderId(folder.id);
    setStatus(`Moved “${folder.name}” ${parentId === null ? 'to workspace root' : 'into folder'}.`);
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

  function moveNote(note: LocalNote, folderId: string | null): void {
    dispatch({ type: 'note/update', note: { ...note, folderId }, now: Date.now() });
    setStatus(`Moved “${note.title}”.`);
  }

  function saveCurrentChat(): void {
    const capability = getChatGptCapability(currentUrl());
    if (capability.currentTarget === null) {
      setStatus('Open a ChatGPT conversation before saving a reference.');
      return;
    }
    const existing = workspace.chatRefs.find((chat) => chat.target === capability.currentTarget);
    if (existing !== undefined) {
      openSavedChat(existing);
      setStatus('Conversation reference is already saved.');
      return;
    }
    setSaveDialogTarget(capability.currentTarget);
  }

  function confirmSaveCurrentChat(input: SaveConversationInput): void {
    if (saveDialogTarget === null) return;
    const existing = workspace.chatRefs.find((chat) => chat.target === saveDialogTarget);
    if (existing !== undefined) {
      setSaveDialogTarget(null);
      openSavedChat(existing);
      setStatus('Conversation reference is already saved.');
      return;
    }
    const now = Date.now();
    const chat = {
      ...createChatReference({
        id: createEntityId('chat'),
        label: input.label,
        target: saveDialogTarget,
        folderId: input.folderId,
        now,
      }),
      pinned: input.pinned,
    };
    dispatch({ type: 'chat/create', chat });
    dispatch({ type: 'tab/open', tab: chatTab(chat), now });
    setSelectedFolderId(input.folderId);
    setSaveDialogTarget(null);
    setStatus(`Saved “${chat.label}”.`);
  }

  function togglePinChat(chat: ChatReference): void {
    dispatch({ type: 'chat/update', chat: { ...chat, pinned: !chat.pinned }, now: Date.now() });
  }

  function renameChat(chat: ChatReference): void {
    const nextName = window.prompt('Rename conversation', chat.label);
    if (nextName === null || nextName.trim() === '') return;
    const updated = { ...chat, label: nextName.trim() };
    const now = Date.now();
    dispatch({ type: 'chat/update', chat: updated, now });
    const tab = workspace.tabs.find((item) => item.kind === 'chat' && item.entityId === chat.id);
    if (tab !== undefined) dispatch({ type: 'tab/open', tab: { ...tab, title: updated.label }, now });
    setStatus(`Renamed conversation to “${updated.label}”.`);
  }

  function moveChat(chat: ChatReference, folderId: string | null): void {
    dispatch({ type: 'chat/update', chat: { ...chat, folderId }, now: Date.now() });
    setStatus(`Moved “${chat.label}”.`);
  }

  function deleteChat(chat: ChatReference): void {
    if (!window.confirm(`Delete the local reference “${chat.label}”? The ChatGPT conversation is not deleted.`)) return;
    dispatch({ type: 'chat/delete', chatId: chat.id, now: Date.now() });
    setStatus(`Deleted local reference “${chat.label}”.`);
  }

  function openSavedChat(chat: ChatReference): void {
    const now = Date.now();
    openTab(chatTab(chat));
    dispatch({ type: 'chat/update', chat, now });
    navigateToChatGptTarget(chat.target, navigate);
  }

  function activateTab(tabId: string): void {
    const tab = workspace.tabs.find((item) => item.id === tabId);
    const now = Date.now();
    dispatch({ type: 'tab/activate', tabId, now });
    if (tab?.kind !== 'chat' || tab.entityId === null) return;
    const chat = workspace.chatRefs.find((item) => item.id === tab.entityId);
    if (chat === undefined) return;
    dispatch({ type: 'chat/update', chat, now });
    navigateToChatGptTarget(chat.target, navigate);
  }

  function openNote(note: LocalNote): void {
    openTab(noteTab(note));
  }

  function openGraph(): void {
    openTab({ id: 'tab-graph', kind: 'graph', entityId: null, title: 'Graph', pinned: false });
  }

  function openSettings(): void {
    openTab({ id: 'tab-settings', kind: 'settings', entityId: null, title: 'Settings', pinned: false });
  }

  function openHome(): void {
    dispatch({ type: 'tab/activate', tabId: 'tab-home', now: Date.now() });
  }

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
    dispatch({
      type: 'edge/create',
      edge: {
        id: createEntityId('edge'),
        sourceEntityId,
        targetEntityId,
        kind: 'related-manually',
        createdAt: now,
      },
      now,
    });
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
      if (vaultBridge === undefined) throw new Error('Local vault bridge is not configured.');
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
    if (bridgeToken === null || vaultBridge === undefined) {
      setBridgeMessage(
        vaultBridge === undefined
          ? 'Local vault bridge is not configured.'
          : 'Connect the local vault bridge before syncing a note.',
      );
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
  const activeChat = activeTab?.kind === 'chat'
    ? workspace.chatRefs.find((chat) => chat.id === activeTab.entityId)
    : undefined;
  const activeNote = activeTab?.kind === 'note'
    ? workspace.notes.find((note) => note.id === activeTab.entityId)
    : undefined;
  const capability = getChatGptCapability(currentUrl());
  const compatibilityLabel = capability.canCaptureCurrentReference
    ? 'Conversation detected'
    : capability.supportedOrigin
      ? 'ChatGPT detected'
      : 'Open ChatGPT';
  const commands: WorkspaceCommand[] = [
    {
      id: 'explorer-toggle',
      label: workspace.layout.treeCollapsed ? 'Show explorer' : 'Hide explorer',
      run: () => updateLayout({ treeCollapsed: !workspace.layout.treeCollapsed }),
    },
    { id: 'folder-create', label: 'Create folder at root', run: () => addFolder(null) },
    { id: 'note-create', label: 'Create note', run: addNote },
    { id: 'chat-save', label: 'Save current chat', run: saveCurrentChat },
    { id: 'graph-open', label: 'Open graph', run: openGraph },
    { id: 'settings-open', label: 'Open settings', run: openSettings },
    { id: 'home-open', label: 'Open home', run: openHome },
  ];

  let surfaceContent: ReactNode;
  if (activeTab?.kind === 'settings') {
    surfaceContent = (
      <div className="h-full min-h-0 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-5 sm:px-5">
          <SettingsPanel
            exportJson={exportJson}
            recoveryJson={recoveryJson}
            persistenceError={persistenceError}
            onImport={importBackup}
            onReset={resetLocalData}
            onDownload={downloadText}
          />
          <ObsidianBridgePanel
            state={bridgeState}
            message={bridgeMessage}
            onConnect={connectBridge}
            onDisconnect={disconnectBridge}
          />
        </div>
      </div>
    );
  } else if (activeTab?.kind === 'graph') {
    surfaceContent = <GraphNavigator graph={graph} onOpenNode={openGraphNode} onCreateManualEdge={createManualEdge} />;
  } else if (activeNote !== undefined) {
    surfaceContent = (
      <div className="grid h-full min-h-0 min-[880px]:grid-cols-[minmax(0,1fr)_260px] max-[879px]:grid-rows-[minmax(0,1fr)_auto]">
        <LocalNoteEditor
          note={activeNote}
          chats={workspace.chatRefs}
          onChange={(note) => dispatch({ type: 'note/update', note, now: Date.now() })}
          onLinkChat={(chatId) => dispatch({ type: 'note/link-chat', noteId: activeNote.id, chatId, now: Date.now() })}
        />
        <NoteContextRail
          note={activeNote}
          notes={workspace.notes}
          bridgeConnected={bridgeState === 'connected'}
          onOpenNote={openNote}
          onSync={() => void syncNoteToVault(activeNote)}
        />
      </div>
    );
  } else if (activeChat !== undefined) {
    const folder = workspace.folders.find((item) => item.id === activeChat.folderId);
    surfaceContent = (
      <ChatDetails
        chat={activeChat}
        folder={folder}
        folders={workspace.folders}
        onRename={() => renameChat(activeChat)}
        onTogglePin={() => togglePinChat(activeChat)}
        onMove={(folderId) => moveChat(activeChat, folderId)}
      />
    );
  } else {
    surfaceContent = (
      <DailyHome
        chats={workspace.chatRefs}
        notes={workspace.notes}
        status={status}
        onOpenChat={openSavedChat}
        onOpenNote={openNote}
      />
    );
  }

  const surface = (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden">
      <WorkbenchChrome
        tabs={workspace.tabs}
        activeTabId={workspace.activeTabId}
        explorerCollapsed={workspace.layout.treeCollapsed}
        providerSupported={capability.supportedOrigin}
        providerLabel={compatibilityLabel}
        onToggleExplorer={() => updateLayout({ treeCollapsed: !workspace.layout.treeCollapsed })}
        onActivateTab={activateTab}
        onCloseTab={(tabId) => dispatch({ type: 'tab/close', tabId, now: Date.now() })}
      />
      {persistenceError !== null && (
        <div className="flex min-w-0 items-center gap-2 border-b border-red-300/10 bg-red-300/[0.045] px-2.5 py-1.5 text-[9px] text-red-100" role="alert">
          <AlertTriangle size={11} className="shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{persistenceError}</span>
          <Button variant="ghost" className="h-6 px-1.5 text-[9px] text-red-100" onClick={openSettings}>Recover</Button>
        </div>
      )}
      {surfaceContent}
    </div>
  );

  const tree = (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
      <div className="grid grid-cols-3 gap-1.5 border-b border-cs-border p-2">
        <Button className="min-w-0 px-1.5" onClick={() => addFolder(null)}>
          <FolderPlus size={11} aria-hidden="true" /> <span className="truncate">Folder</span>
        </Button>
        <Button className="min-w-0 px-1.5" onClick={addNote}>
          <FilePlus2 size={11} aria-hidden="true" /> <span className="truncate">Note</span>
        </Button>
        <Button variant="primary" className="min-w-0 px-1.5" onClick={saveCurrentChat}>
          <BookmarkPlus size={11} aria-hidden="true" /> <span className="truncate">Save chat</span>
        </Button>
      </div>
      <WorkspaceTree
        folders={workspace.folders}
        chatRefs={workspace.chatRefs}
        notes={workspace.notes}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onToggleFolder={(folderId) => dispatch({ type: 'folder/toggle', folderId, now: Date.now() })}
        onCreateChildFolder={(folderId) => addFolder(folderId)}
        onRenameFolder={renameFolder}
        onDeleteFolder={deleteFolder}
        onMoveFolder={moveFolder}
        onOpenChat={openSavedChat}
        onOpenNote={openNote}
        onTogglePinChat={togglePinChat}
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        onMoveChat={moveChat}
        onMoveNote={moveNote}
      />
    </div>
  );

  return (
    <>
      <SpatialWorkspace
        tree={tree}
        surface={surface}
        treeCollapsed={workspace.layout.treeCollapsed}
        treeWidth={workspace.layout.treeWidth}
        onTreeWidthChange={(treeWidth) => updateLayout({ treeWidth })}
      />
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
      <SaveConversationDialog
        open={saveDialogTarget !== null}
        target={saveDialogTarget}
        folders={workspace.folders}
        defaultFolderId={selectedFolderId}
        defaultLabel={`Conversation ${workspace.chatRefs.length + 1}`}
        onCancel={() => setSaveDialogTarget(null)}
        onSave={confirmSaveCurrentChat}
      />
    </>
  );
}
