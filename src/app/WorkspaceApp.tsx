import { AlertTriangle, BookmarkPlus, FilePlus2, FolderPlus, Inbox } from 'lucide-react';
import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';

import { projectWorkspaceGraph, type GraphNode } from '../domain/graph/projectGraph';
import { replaceNoteLinkToken, type NoteLinkToken } from '../domain/notes/noteLinks';
import { canMoveFolder } from '../domain/workspace/integrity';
import { exportWorkspaceJson } from '../domain/workspace/io';
import {
  INBOX_FOLDER_ID,
  LEARNING_TEMPLATE_ID,
  createChatReference,
  createEntityId,
  createFolder,
  createInitialWorkspace,
  createLocalNote,
  type ChatReference,
  type KnowledgeFilter,
  type LocalNote,
  type NoteTemplate,
  type SavedKnowledgeView,
  type WorkspaceFolder,
  type WorkspaceTab,
} from '../domain/workspace/model';
import type { WorkspaceArtifactRef } from '../domain/workspace/retrieval';
import { createSavedKnowledgeView, instantiateNoteTemplate } from '../domain/workspace/structuredKnowledge';
import { workspaceReducer } from '../domain/workspace/workspaceReducer';
import { ChatDetails } from '../features/chat-details/ChatDetails';
import { QuickCaptureDialog } from '../features/capture-inbox/QuickCaptureDialog';
import {
  CommandPalette,
  type WorkspaceCommand,
  type WorkspaceQuickOpenItem,
} from '../features/command-palette/CommandPalette';
import { GraphNavigator } from '../features/graph/GraphNavigator';
import { DailyHome } from '../features/home/DailyHome';
import { CreateKnowledgeViewDialog } from '../features/knowledge-views/CreateKnowledgeViewDialog';
import { KnowledgeViewPage } from '../features/knowledge-views/KnowledgeViewPage';
import { LocalNoteEditor } from '../features/local-notes/LocalNoteEditor';
import { NoteContextRail } from '../features/local-notes/NoteContextRail';
import { LocalVaultPage } from '../features/local-vault/LocalVaultPage';
import { useLocalVaultController } from '../features/local-vault/useLocalVaultController';
import { SaveConversationDialog, type SaveConversationInput } from '../features/save-conversation/SaveConversationDialog';
import { SettingsPanel } from '../features/settings/SettingsPanel';
import { WorkbenchChrome } from '../features/workbench/WorkbenchChrome';
import { SpatialWorkspace } from '../features/workspace-layout/SpatialWorkspace';
import { WorkspaceTree } from '../features/workspace-tree/WorkspaceTree';
import type { LocalVault } from '../integrations/local-vault/BrowserLocalVault';
import type { WorkspaceRepository } from '../persistence/workspaceRepository';
import { getChatGptCapability, navigateToChatGptTarget } from '../providers/chatgpt/adapter';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Button, IconButton } from '../ui/primitives';
import { TextInputDialog } from '../ui/TextInputDialog';
import { useWorkspacePersistence } from './controllers/useWorkspacePersistence';

export type WorkspaceView = 'workspace' | 'markdown-sync';
type SaveDialogIntent = 'save' | 'distill';

interface WorkspaceAppProps {
  repository: WorkspaceRepository;
  view?: WorkspaceView;
  onBackToWorkspace?: () => void;
  onOpenMarkdownSync?: () => void;
  currentUrl?: () => string;
  currentTitle?: () => string | null;
  navigate?: (url: string) => void;
  downloadText?: (filename: string, content: string) => void;
  localVault?: LocalVault;
}

type PendingDelete =
  | { kind: 'folder'; folder: WorkspaceFolder }
  | { kind: 'chat'; chat: ChatReference }
  | { kind: 'note'; note: LocalNote }
  | { kind: 'bulk'; refs: WorkspaceArtifactRef[] }
  | null;

type PendingRename =
  | { kind: 'folder'; folder: WorkspaceFolder }
  | { kind: 'chat'; chat: ChatReference }
  | { kind: 'note'; note: LocalNote }
  | null;

function defaultDownloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function captureTitle(content: string): string {
  const firstLine = content.split(/\r?\n/).map((line) => line.trim()).find((line) => line !== '') ?? 'Inbox capture';
  return firstLine.replace(/^#+\s*/, '').slice(0, 96) || 'Inbox capture';
}

function browserConversationLabel(title: string | null | undefined): string | null {
  const trimmed = title?.trim();
  if (trimmed === undefined || trimmed === '') return null;
  const withoutProvider = trimmed.replace(/\s*(?:[-–—|]\s*)?ChatGPT\s*$/i, '').trim();
  return withoutProvider === '' ? null : withoutProvider.slice(0, 120);
}

export function WorkspaceApp({
  repository: workspaceRepository,
  view = 'workspace',
  onBackToWorkspace = () => undefined,
  onOpenMarkdownSync,
  currentUrl = () => window.location.href,
  currentTitle = () => null,
  navigate = (url) => window.location.assign(url),
  downloadText = defaultDownloadText,
  localVault,
}: WorkspaceAppProps) {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, () => createInitialWorkspace());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [status, setStatus] = useState('Local workspace ready.');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<NoteTemplate | null>(null);
  const [saveDialogTarget, setSaveDialogTarget] = useState<string | null>(null);
  const [saveDialogIntent, setSaveDialogIntent] = useState<SaveDialogIntent>('save');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [pendingRename, setPendingRename] = useState<PendingRename>(null);
  const [noteContextExpanded, setNoteContextExpanded] = useState(true);

  const activeChatRefs = useMemo(() => workspace.chatRefs.filter((chat) => chat.archivedAt === null), [workspace.chatRefs]);
  const activeNotes = useMemo(() => workspace.notes.filter((note) => note.archivedAt === null), [workspace.notes]);
  const folderNameById = useMemo(() => new Map(workspace.folders.map((folder) => [folder.id, folder.name])), [workspace.folders]);
  const graph = useMemo(() => projectWorkspaceGraph(workspace), [workspace]);
  const exportJson = useMemo(() => exportWorkspaceJson(workspace), [workspace]);
  const { persistenceError, recoveryJson, importBackup, resetLocalData } = useWorkspacePersistence({
    repository: workspaceRepository,
    workspace,
    dispatch,
    onResetSelection: () => setSelectedFolderId(null),
    onStatus: setStatus,
  });
  const {
    state: vaultState,
    connection: vaultConnection,
    message: vaultMessage,
    busy: vaultBusy,
    connect: connectVault,
    reconnect: reconnectVault,
    disconnect: disconnectVault,
    syncNote: syncNoteToVault,
  } = useLocalVaultController({ localVault, onStatus: setStatus });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setCaptureOpen(true);
        return;
      }
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
    return { id: `tab-note-${note.id}`, kind: 'note', entityId: note.id, title: note.title.trim() || 'Untitled note', pinned: false };
  }

  function viewTab(savedView: SavedKnowledgeView): WorkspaceTab {
    return { id: `tab-view-${savedView.id}`, kind: 'view', entityId: savedView.id, title: savedView.name, pinned: false };
  }

  function openTab(tab: WorkspaceTab): void {
    dispatch({ type: 'tab/open', tab, now: Date.now() });
  }

  function updateLayout(next: Partial<typeof workspace.layout>): void {
    dispatch({ type: 'layout/update', layout: { ...workspace.layout, ...next }, now: Date.now() });
  }

  function addFolder(parentId: string | null = null): void {
    if (parentId === INBOX_FOLDER_ID) {
      setStatus('Inbox is a reserved capture folder and cannot contain subfolders.');
      return;
    }
    const now = Date.now();
    const folder = createFolder({ id: createEntityId('folder'), name: 'New folder', parentId, now });
    dispatch({ type: 'folder/create', folder });
    setSelectedFolderId(folder.id);
    setStatus(parentId === null ? 'Folder created at workspace root.' : 'Subfolder created.');
  }

  function renameFolder(folder: WorkspaceFolder): void {
    if (folder.id === INBOX_FOLDER_ID) {
      setStatus('Inbox is a reserved capture folder.');
      return;
    }
    setPendingRename({ kind: 'folder', folder });
  }

  function moveFolder(folder: WorkspaceFolder, parentId: string | null): void {
    if (folder.id === INBOX_FOLDER_ID || parentId === INBOX_FOLDER_ID) {
      setStatus('Inbox stays at workspace root and does not contain subfolders.');
      return;
    }
    if (!canMoveFolder(workspace.folders, folder.id, parentId)) {
      setStatus('A folder cannot be moved into itself or one of its descendants.');
      return;
    }
    dispatch({ type: 'folder/update', folder: { ...folder, parentId }, now: Date.now() });
    setSelectedFolderId(folder.id);
    setStatus(`Moved “${folder.name}” ${parentId === null ? 'to workspace root' : 'into folder'}.`);
  }

  function deleteFolder(folder: WorkspaceFolder): void {
    if (folder.id === INBOX_FOLDER_ID) {
      setStatus('Inbox is a reserved capture folder and cannot be deleted.');
      return;
    }
    setPendingDelete({ kind: 'folder', folder });
  }

  function addNote(folderId: string | null = selectedFolderId): void {
    const now = Date.now();
    const note = createLocalNote({ id: createEntityId('note'), title: 'Untitled note', folderId, now });
    dispatch({ type: 'note/create', note });
    dispatch({ type: 'tab/open', tab: noteTab(note), now });
    setSelectedFolderId(folderId);
    setStatus('Note created locally.');
  }

  function updateNote(note: LocalNote): void {
    const now = Date.now();
    dispatch({ type: 'note/update', note, now });
    const tab = workspace.tabs.find((item) => item.kind === 'note' && item.entityId === note.id);
    const title = note.title.trim() || 'Untitled note';
    if (tab !== undefined && tab.title !== title) dispatch({ type: 'tab/open', tab: { ...tab, title }, now });
  }

  function renameNote(note: LocalNote): void {
    setPendingRename({ kind: 'note', note });
  }

  function deleteNote(note: LocalNote): void {
    setPendingDelete({ kind: 'note', note });
  }

  function moveNote(note: LocalNote, folderId: string | null): void {
    dispatch({ type: 'note/update', note: { ...note, folderId }, now: Date.now() });
    setStatus(`Moved “${note.title}”.`);
  }

  function createDistilledNote(chat: ChatReference): void {
    const now = Date.now();
    const folderId = chat.folderId === INBOX_FOLDER_ID ? null : chat.folderId;
    const note = {
      ...createLocalNote({ id: createEntityId('note'), title: chat.label, folderId, now }),
      linkedChatIds: [chat.id],
    };
    dispatch({ type: 'note/create', note });
    dispatch({ type: 'tab/open', tab: noteTab(note), now });
    setSelectedFolderId(folderId);
    setStatus(`Created durable note from “${chat.label}”.`);
  }

  function saveCurrentChat(): void {
    const capability = getChatGptCapability(currentUrl());
    if (capability.currentTarget === null) {
      setStatus('Open a ChatGPT conversation before saving a reference.');
      return;
    }
    const existing = workspace.chatRefs.find((chat) => chat.target === capability.currentTarget);
    if (existing !== undefined) {
      if (existing.archivedAt !== null) {
        dispatch({ type: 'artifact/bulk-archive', refs: [{ kind: 'chat', id: existing.id }], archivedAt: null, now: Date.now() });
      }
      openSavedChat(existing);
      setStatus(existing.archivedAt === null ? 'Conversation reference is already saved.' : 'Conversation reference restored from archive.');
      return;
    }
    setSaveDialogIntent('save');
    setSaveDialogTarget(capability.currentTarget);
  }

  function distillCurrentChat(): void {
    const capability = getChatGptCapability(currentUrl());
    if (capability.currentTarget === null) {
      setStatus('Open a ChatGPT conversation before distilling knowledge.');
      return;
    }
    const existing = workspace.chatRefs.find((chat) => chat.target === capability.currentTarget);
    if (existing !== undefined) {
      if (existing.archivedAt !== null) {
        dispatch({ type: 'artifact/bulk-archive', refs: [{ kind: 'chat', id: existing.id }], archivedAt: null, now: Date.now() });
      }
      createDistilledNote(existing);
      return;
    }
    setSaveDialogIntent('distill');
    setSaveDialogTarget(capability.currentTarget);
  }

  function confirmSaveCurrentChat(input: SaveConversationInput): void {
    if (saveDialogTarget === null) return;
    const intent = saveDialogIntent;
    const existing = workspace.chatRefs.find((chat) => chat.target === saveDialogTarget);
    if (existing !== undefined) {
      setSaveDialogTarget(null);
      setSaveDialogIntent('save');
      if (existing.archivedAt !== null) {
        dispatch({ type: 'artifact/bulk-archive', refs: [{ kind: 'chat', id: existing.id }], archivedAt: null, now: Date.now() });
      }
      if (intent === 'distill') createDistilledNote(existing);
      else openSavedChat(existing);
      setStatus(intent === 'distill' ? `Created durable note from “${existing.label}”.` : existing.archivedAt === null ? 'Conversation reference is already saved.' : 'Conversation reference restored from archive.');
      return;
    }
    const now = Date.now();
    const chat = {
      ...createChatReference({
        id: createEntityId('chat'),
        label: input.label,
        annotation: input.annotation,
        target: saveDialogTarget,
        folderId: input.folderId,
        now,
      }),
      pinned: input.pinned,
    };
    dispatch({ type: 'chat/create', chat });
    setSelectedFolderId(input.folderId);
    setSaveDialogTarget(null);
    setSaveDialogIntent('save');
    if (intent === 'distill') createDistilledNote(chat);
    else {
      dispatch({ type: 'tab/open', tab: chatTab(chat), now });
      setStatus(`Saved “${chat.label}”.`);
    }
  }

  function updateChatAnnotation(chat: ChatReference, annotation: string): void {
    dispatch({ type: 'chat/update', chat: { ...chat, annotation: annotation.slice(0, 500) }, now: Date.now() });
  }

  function togglePinChat(chat: ChatReference): void {
    dispatch({ type: 'chat/update', chat: { ...chat, pinned: !chat.pinned }, now: Date.now() });
  }

  function renameChat(chat: ChatReference): void {
    setPendingRename({ kind: 'chat', chat });
  }

  function moveChat(chat: ChatReference, folderId: string | null): void {
    dispatch({ type: 'chat/update', chat: { ...chat, folderId }, now: Date.now() });
    setStatus(`Moved “${chat.label}”.`);
  }

  function deleteChat(chat: ChatReference): void {
    setPendingDelete({ kind: 'chat', chat });
  }

  function bulkMove(refs: WorkspaceArtifactRef[], folderId: string | null): void {
    dispatch({ type: 'artifact/bulk-move', refs, folderId, now: Date.now() });
    setStatus(`Moved ${refs.length} local item${refs.length === 1 ? '' : 's'}.`);
  }

  function bulkPin(refs: WorkspaceArtifactRef[], pinned: boolean): void {
    dispatch({ type: 'artifact/bulk-pin', refs, pinned, now: Date.now() });
    const count = refs.filter((ref) => ref.kind === 'chat').length;
    setStatus(`${pinned ? 'Pinned' : 'Unpinned'} ${count} saved chat${count === 1 ? '' : 's'}.`);
  }

  function bulkArchive(refs: WorkspaceArtifactRef[], archived: boolean): void {
    const now = Date.now();
    dispatch({ type: 'artifact/bulk-archive', refs, archivedAt: archived ? now : null, now });
    setStatus(`${archived ? 'Archived' : 'Restored'} ${refs.length} local item${refs.length === 1 ? '' : 's'}.`);
  }

  function confirmRename(value: string): void {
    if (pendingRename === null) return;
    const now = Date.now();

    if (pendingRename.kind === 'folder') {
      const folder = pendingRename.folder;
      dispatch({ type: 'folder/update', folder: { ...folder, name: value }, now });
      setStatus(`Renamed folder to “${value}”.`);
    } else if (pendingRename.kind === 'chat') {
      const chat = pendingRename.chat;
      const updated = { ...chat, label: value };
      dispatch({ type: 'chat/update', chat: updated, now });
      const tab = workspace.tabs.find((item) => item.kind === 'chat' && item.entityId === chat.id);
      if (tab !== undefined) dispatch({ type: 'tab/open', tab: { ...tab, title: updated.label }, now });
      setStatus(`Renamed conversation to “${updated.label}”.`);
    } else {
      const note = pendingRename.note;
      const updated = { ...note, title: value };
      dispatch({ type: 'note/update', note: updated, now });
      const tab = workspace.tabs.find((item) => item.kind === 'note' && item.entityId === note.id);
      if (tab !== undefined) dispatch({ type: 'tab/open', tab: { ...tab, title: value }, now });
      setStatus(`Renamed note to “${value}”.`);
    }

    setPendingRename(null);
  }

  function confirmDelete(): void {
    if (pendingDelete === null) return;
    const now = Date.now();

    if (pendingDelete.kind === 'folder') {
      const folder = pendingDelete.folder;
      dispatch({ type: 'folder/delete', folderId: folder.id, now });
      if (selectedFolderId === folder.id) setSelectedFolderId(folder.parentId);
      setStatus(`Deleted folder “${folder.name}”.`);
    } else if (pendingDelete.kind === 'chat') {
      const chat = pendingDelete.chat;
      dispatch({ type: 'chat/delete', chatId: chat.id, now });
      setStatus(`Deleted local reference “${chat.label}”.`);
    } else if (pendingDelete.kind === 'note') {
      const note = pendingDelete.note;
      dispatch({ type: 'note/delete', noteId: note.id, now });
      setStatus(`Deleted note “${note.title}”.`);
    } else {
      dispatch({ type: 'artifact/bulk-delete', refs: pendingDelete.refs, now });
      setStatus(`Deleted ${pendingDelete.refs.length} local item${pendingDelete.refs.length === 1 ? '' : 's'}.`);
    }

    setPendingDelete(null);
  }

  function openSavedChat(chat: ChatReference): void {
    const now = Date.now();
    openTab(chatTab(chat));
    dispatch({ type: 'chat/update', chat, now });
    navigateToChatGptTarget(chat.target, navigate);
  }

  function openNote(note: LocalNote): void {
    openTab(noteTab(note));
  }

  function openSavedView(savedView: SavedKnowledgeView): void {
    openTab(viewTab(savedView));
  }

  function createKnowledgeView(name: string, filters: KnowledgeFilter[]): void {
    const now = Date.now();
    const savedView = createSavedKnowledgeView({ id: createEntityId('view'), name, filters, now });
    dispatch({ type: 'view/create', view: savedView });
    openTab(viewTab(savedView));
    setViewDialogOpen(false);
    setStatus(`Saved view “${savedView.name}”.`);
  }

  function deleteKnowledgeView(savedView: SavedKnowledgeView): void {
    dispatch({ type: 'view/delete', viewId: savedView.id, now: Date.now() });
    setStatus(`Deleted saved view “${savedView.name}”. Notes were not changed.`);
  }

  function confirmTemplateCreation(title: string): void {
    if (pendingTemplate === null) return;
    const now = Date.now();
    const note = instantiateNoteTemplate({
      template: pendingTemplate,
      id: createEntityId('note'),
      title,
      folderId: selectedFolderId,
      now,
    });
    dispatch({ type: 'note/create', note });
    openTab(noteTab(note));
    setPendingTemplate(null);
    setStatus(`Created “${note.title}” from ${pendingTemplate.name}.`);
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

  function openGraph(): void {
    openTab({ id: 'tab-graph', kind: 'graph', entityId: null, title: 'Graph', pinned: false });
  }

  function openSettings(): void {
    openTab({ id: 'tab-settings', kind: 'settings', entityId: null, title: 'Settings', pinned: false });
  }

  function openHome(): void {
    dispatch({ type: 'tab/activate', tabId: 'tab-home', now: Date.now() });
  }

  function openLibrary(): void {
    if (workspace.layout.treeCollapsed) updateLayout({ treeCollapsed: false });
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

  function deleteManualEdge(graphEdgeId: string): void {
    const prefix = 'manual:';
    if (!graphEdgeId.startsWith(prefix)) return;
    dispatch({ type: 'edge/delete', edgeId: graphEdgeId.slice(prefix.length), now: Date.now() });
    setStatus('Manual graph relation deleted.');
  }

  function createMissingLinkedNote(title: string, source: LocalNote): void {
    const now = Date.now();
    const note = createLocalNote({ id: createEntityId('note'), title, folderId: source.folderId, now });
    dispatch({ type: 'note/create', note });
    openTab(noteTab(note));
    setStatus(`Created “${note.title}” from unresolved link.`);
  }

  function replaceBrokenLink(source: LocalNote, token: NoteLinkToken, target: LocalNote): void {
    updateNote({ ...source, content: replaceNoteLinkToken(source.content, token, target.title) });
    setStatus(`Linked to “${target.title}”.`);
  }

  function captureToInbox(content: string): void {
    const now = Date.now();
    const capability = getChatGptCapability(currentUrl());
    const linkedChat = capability.currentTarget === null
      ? undefined
      : activeChatRefs.find((chat) => chat.target === capability.currentTarget);
    const note = {
      ...createLocalNote({ id: createEntityId('note'), title: captureTitle(content), folderId: INBOX_FOLDER_ID, now }),
      content,
      linkedChatIds: linkedChat === undefined ? [] : [linkedChat.id],
    };
    dispatch({ type: 'note/create', note });
    setCaptureOpen(false);
    setStatus(linkedChat === undefined ? 'Captured to Inbox.' : `Captured to Inbox · linked to “${linkedChat.label}”.`);
  }

  const activeTab = workspace.tabs.find((tab) => tab.id === workspace.activeTabId) ?? workspace.tabs[0];
  const activeChat = activeTab?.kind === 'chat' ? workspace.chatRefs.find((chat) => chat.id === activeTab.entityId) : undefined;
  const activeNote = activeTab?.kind === 'note' ? workspace.notes.find((note) => note.id === activeTab.entityId) : undefined;
  const activeSavedView = activeTab?.kind === 'view' ? workspace.savedViews.find((savedView) => savedView.id === activeTab.entityId) : undefined;
  const capability = getChatGptCapability(currentUrl());
  const currentLinkedChat = capability.currentTarget === null ? undefined : activeChatRefs.find((chat) => chat.target === capability.currentTarget);
  const compatibilityLabel = capability.canCaptureCurrentReference ? 'Conversation detected' : capability.supportedOrigin ? 'ChatGPT detected' : 'Open ChatGPT';
  const currentConversationLabel = browserConversationLabel(currentTitle()) ?? `Conversation ${workspace.chatRefs.length + 1}`;
  const templateCommands: WorkspaceCommand[] = workspace.noteTemplates
    .filter((template) => template.id !== LEARNING_TEMPLATE_ID)
    .map((template) => ({
      id: `template-${template.id}`,
      label: `New from template: ${template.name}`,
      priority: 60,
      run: () => setPendingTemplate(template),
    }));
  const commands: WorkspaceCommand[] = [
    { id: 'capture-quick', label: 'Quick capture to Inbox', priority: 0, run: () => setCaptureOpen(true) },
    { id: 'chat-save', label: 'Save current chat', priority: 1, run: saveCurrentChat },
    { id: 'chat-distill', label: 'Distill current chat to note', priority: 2, run: distillCurrentChat },
    { id: 'note-create', label: 'Create note', priority: 3, run: () => addNote() },
    { id: 'home-open', label: 'Open home', priority: 4, run: openHome },
    { id: 'folder-create', label: 'Create folder at root', priority: 5, run: () => addFolder(null) },
    { id: 'library-open', label: 'Open library', priority: 6, run: openLibrary },
    { id: 'settings-open', label: 'Open settings', priority: 20, run: openSettings },
    { id: 'view-create', label: 'Create saved view', priority: 40, run: () => setViewDialogOpen(true) },
    { id: 'graph-open', label: 'Open graph', priority: 50, run: openGraph },
    ...templateCommands,
  ];
  const quickOpenItems: WorkspaceQuickOpenItem[] = [
    ...workspace.folders.map((folder) => ({
      id: folder.id,
      kind: 'folder' as const,
      label: folder.name,
      searchText: folder.name,
      detail: 'Folder',
      run: () => { setSelectedFolderId(folder.id); openLibrary(); },
    })),
    ...workspace.savedViews.map((savedView) => ({
      id: savedView.id,
      kind: 'view' as const,
      label: savedView.name,
      searchText: savedView.name,
      contextText: savedView.filters.map((filter) => `${filter.property} ${JSON.stringify(filter.value)}`).join('\n'),
      detail: 'Saved view',
      updatedAt: savedView.updatedAt,
      run: () => openSavedView(savedView),
    })),
    ...activeChatRefs.map((chat) => {
      const folderName = chat.folderId === null ? '' : folderNameById.get(chat.folderId) ?? '';
      return {
        id: chat.id,
        kind: 'chat' as const,
        label: chat.label,
        searchText: chat.label,
        contextText: `${chat.annotation}\n${folderName}`,
        detail: chat.annotation || folderName || 'Saved conversation',
        pinned: chat.pinned,
        updatedAt: chat.updatedAt,
        run: () => openSavedChat(chat),
      };
    }),
    ...activeNotes.map((note) => {
      const folderName = note.folderId === null ? '' : folderNameById.get(note.folderId) ?? '';
      const properties = Object.entries(note.properties).map(([key, value]) => `${key} ${JSON.stringify(value)}`).join(' ');
      return {
        id: note.id,
        kind: 'note' as const,
        label: note.title,
        searchText: note.title,
        contextText: `${note.tags.join(' ')}\n${properties}\n${folderName}`,
        contentText: note.content,
        detail: note.tags.length > 0 ? note.tags.join(' · ') : folderName || 'Local note',
        updatedAt: note.updatedAt,
        run: () => openNote(note),
      };
    }),
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
            onOpenMarkdownSync={onOpenMarkdownSync}
          />
        </div>
      </div>
    );
  } else if (activeTab?.kind === 'graph') {
    surfaceContent = <GraphNavigator graph={graph} onOpenNode={openGraphNode} onDeleteManualEdge={deleteManualEdge} />;
  } else if (activeSavedView !== undefined) {
    surfaceContent = <KnowledgeViewPage view={activeSavedView} notes={activeNotes} onOpenNote={openNote} onDelete={() => deleteKnowledgeView(activeSavedView)} />;
  } else if (activeNote !== undefined) {
    surfaceContent = (
      <div className={noteContextExpanded ? 'grid h-full min-h-0 min-[880px]:grid-cols-[minmax(0,1fr)_260px] max-[879px]:grid-rows-[minmax(0,1fr)_auto]' : 'h-full min-h-0'}>
        <LocalNoteEditor note={activeNote} notes={activeNotes} chats={activeChatRefs} contextExpanded={noteContextExpanded} onChange={updateNote} onLinkChat={(chatId) => dispatch({ type: 'note/link-chat', noteId: activeNote.id, chatId, now: Date.now() })} onOpenChat={openSavedChat} onOpenNote={openNote} onToggleContext={() => setNoteContextExpanded((current) => !current)} />
        {noteContextExpanded && (
          <NoteContextRail
            note={activeNote}
            notes={activeNotes}
            onChangeNote={updateNote}
            onOpenNote={openNote}
            onCreateMissingLink={(title) => createMissingLinkedNote(title, activeNote)}
            onReplaceBrokenLink={(token, target) => replaceBrokenLink(activeNote, token, target)}
          />
        )}
      </div>
    );
  } else if (activeChat !== undefined) {
    const folder = workspace.folders.find((item) => item.id === activeChat.folderId);
    const linkedNotes = activeNotes.filter((note) => note.linkedChatIds.includes(activeChat.id));
    surfaceContent = (
      <ChatDetails
        chat={activeChat}
        folder={folder}
        folders={workspace.folders}
        linkedNotes={linkedNotes}
        onResume={() => openSavedChat(activeChat)}
        onDistill={() => createDistilledNote(activeChat)}
        onOpenNote={openNote}
        onRename={() => renameChat(activeChat)}
        onAnnotationChange={(annotation) => updateChatAnnotation(activeChat, annotation)}
        onTogglePin={() => togglePinChat(activeChat)}
        onMove={(folderId) => moveChat(activeChat, folderId)}
      />
    );
  } else {
    surfaceContent = (
      <DailyHome
        chats={activeChatRefs}
        notes={activeNotes}
        status={status}
        currentConversation={{
          supported: capability.currentTarget !== null,
          label: currentConversationLabel,
          savedChat: currentLinkedChat ?? null,
        }}
        onSaveCurrentChat={saveCurrentChat}
        onDistillCurrentChat={distillCurrentChat}
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
        onOpenHome={openHome}
        onOpenLibrary={openLibrary}
        onOpenSettings={openSettings}
        onOpenMore={openGraph}
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
      <div className="row-start-3 min-h-0 overflow-hidden">{surfaceContent}</div>
    </div>
  );

  const tree = (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
      <div className="flex h-9 items-center justify-start gap-0.5 border-b border-cs-border px-2 py-1">
        <IconButton className="size-6 rounded-md text-cs-subtle" aria-label="Create folder" title="Create folder" onClick={() => addFolder(null)}><FolderPlus size={11} aria-hidden="true" /></IconButton>
        <IconButton className="size-6 rounded-md text-cs-subtle" aria-label="Create note" title="Create note" onClick={() => addNote()}><FilePlus2 size={11} aria-hidden="true" /></IconButton>
        <IconButton className="size-6 rounded-md text-cs-subtle" aria-label="Quick capture" title="Quick capture · Ctrl/Cmd+Shift+N" onClick={() => setCaptureOpen(true)}><Inbox size={11} aria-hidden="true" /></IconButton>
        <IconButton className="size-6 rounded-md bg-cs-control text-cs-text" aria-label="Save current chat" title="Save current chat" onClick={saveCurrentChat}><BookmarkPlus size={11} aria-hidden="true" /></IconButton>
      </div>
      <WorkspaceTree
        folders={workspace.folders}
        chatRefs={workspace.chatRefs}
        notes={workspace.notes}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onToggleFolder={(folderId) => dispatch({ type: 'folder/toggle', folderId, now: Date.now() })}
        onCreateFolder={addFolder}
        onCreateNote={addNote}
        onRenameFolder={renameFolder}
        onDeleteFolder={deleteFolder}
        onMoveFolder={moveFolder}
        onOpenChat={openSavedChat}
        onOpenNote={openNote}
        onTogglePinChat={togglePinChat}
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        onRenameNote={renameNote}
        onDeleteNote={deleteNote}
        onMoveChat={moveChat}
        onMoveNote={moveNote}
        onBulkMove={bulkMove}
        onBulkPin={bulkPin}
        onBulkArchive={bulkArchive}
        onBulkDelete={(refs) => setPendingDelete({ kind: 'bulk', refs })}
      />
    </div>
  );

  const workspaceSurface = <SpatialWorkspace tree={tree} surface={surface} treeCollapsed={workspace.layout.treeCollapsed} treeWidth={workspace.layout.treeWidth} onTreeWidthChange={(treeWidth) => updateLayout({ treeWidth })} />;

  const deleteDescription = pendingDelete?.kind === 'folder'
    ? `Delete “${pendingDelete.folder.name}”? Child items will move to ${pendingDelete.folder.parentId === null ? 'Workspace root' : 'the parent folder'}.`
    : pendingDelete?.kind === 'chat'
      ? `Delete the local reference “${pendingDelete.chat.label}”? The ChatGPT conversation itself will not be deleted.`
      : pendingDelete?.kind === 'note'
        ? `Delete the local note “${pendingDelete.note.title}”? This removes the note and its local graph relationships.`
        : pendingDelete?.kind === 'bulk'
          ? `Delete ${pendingDelete.refs.length} selected local item${pendingDelete.refs.length === 1 ? '' : 's'}? Saved ChatGPT conversations themselves will not be deleted.`
          : '';
  const deleteTitle = pendingDelete?.kind === 'folder' ? 'Delete folder?' : pendingDelete?.kind === 'chat' ? 'Delete conversation reference?' : pendingDelete?.kind === 'bulk' ? `Delete ${pendingDelete.refs.length} items?` : 'Delete note?';
  const renameTitle = pendingRename?.kind === 'folder' ? 'Rename folder' : pendingRename?.kind === 'chat' ? 'Rename conversation' : 'Rename note';
  const renameLabel = pendingRename?.kind === 'folder' ? 'Folder name' : pendingRename?.kind === 'chat' ? 'Conversation name' : 'Note title';
  const renameInitialValue = pendingRename?.kind === 'folder' ? pendingRename.folder.name : pendingRename?.kind === 'chat' ? pendingRename.chat.label : pendingRename?.kind === 'note' ? pendingRename.note.title : '';

  return (
    <>
      {view === 'markdown-sync' ? (
        <LocalVaultPage
          state={vaultState}
          connection={vaultConnection}
          message={vaultMessage}
          busy={vaultBusy}
          activeNote={activeNote ?? null}
          onBack={onBackToWorkspace}
          onConnect={connectVault}
          onReconnect={reconnectVault}
          onChangeVault={connectVault}
          onDisconnect={disconnectVault}
          onSyncActiveNote={async () => { if (activeNote !== undefined) await syncNoteToVault(activeNote); }}
        />
      ) : workspaceSurface}
      {view === 'workspace' && paletteOpen && <CommandPalette commands={commands} items={quickOpenItems} onClose={() => setPaletteOpen(false)} />}
      {view === 'workspace' && (
        <>
          <QuickCaptureDialog open={captureOpen} linkedChatLabel={currentLinkedChat?.label ?? null} onSave={captureToInbox} onClose={() => setCaptureOpen(false)} />
          <CreateKnowledgeViewDialog open={viewDialogOpen} notes={activeNotes} onSave={createKnowledgeView} onClose={() => setViewDialogOpen(false)} />
        </>
      )}
      <SaveConversationDialog
        open={saveDialogTarget !== null}
        target={saveDialogTarget}
        folders={workspace.folders}
        defaultFolderId={selectedFolderId}
        defaultLabel={currentConversationLabel}
        onCancel={() => { setSaveDialogTarget(null); setSaveDialogIntent('save'); }}
        onSave={confirmSaveCurrentChat}
      />
      <ConfirmDialog open={pendingDelete !== null} title={deleteTitle} description={deleteDescription} confirmLabel="Delete" danger onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
      <TextInputDialog
        open={pendingRename !== null}
        title={renameTitle}
        description={pendingRename?.kind === 'chat' ? 'This changes only the local Chatspace label.' : undefined}
        label={renameLabel}
        initialValue={renameInitialValue}
        confirmLabel="Rename"
        onConfirm={confirmRename}
        onCancel={() => setPendingRename(null)}
      />
      <TextInputDialog
        open={pendingTemplate !== null}
        title={pendingTemplate === null ? 'New from template' : `New from ${pendingTemplate.name}`}
        description="Creates a normal local note. Supported template variables are {{title}} and {{date}} only."
        label="Note title"
        initialValue=""
        confirmLabel="Create note"
        onConfirm={confirmTemplateCreation}
        onCancel={() => setPendingTemplate(null)}
      />
    </>
  );
}
