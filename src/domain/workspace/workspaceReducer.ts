import { canMoveFolder } from './integrity';
import type {
  ChatReference,
  LocalNote,
  ManualGraphEdge,
  PanelLayout,
  WorkspaceFolder,
  WorkspaceSnapshot,
  WorkspaceTab,
} from './model';
import type { WorkspaceArtifactRef } from './retrieval';

export type WorkspaceAction =
  | { type: 'folder/create'; folder: WorkspaceFolder }
  | { type: 'folder/update'; folder: WorkspaceFolder; now: number }
  | { type: 'folder/toggle'; folderId: string; now: number }
  | { type: 'folder/delete'; folderId: string; now: number }
  | { type: 'chat/create'; chat: ChatReference }
  | { type: 'chat/update'; chat: ChatReference; now: number }
  | { type: 'chat/delete'; chatId: string; now: number }
  | { type: 'note/create'; note: LocalNote }
  | { type: 'note/update'; note: LocalNote; now: number }
  | { type: 'note/delete'; noteId: string; now: number }
  | { type: 'note/link-chat'; noteId: string; chatId: string; now: number }
  | { type: 'artifact/bulk-move'; refs: WorkspaceArtifactRef[]; folderId: string | null; now: number }
  | { type: 'artifact/bulk-pin'; refs: WorkspaceArtifactRef[]; pinned: boolean; now: number }
  | { type: 'artifact/bulk-archive'; refs: WorkspaceArtifactRef[]; archivedAt: number | null; now: number }
  | { type: 'artifact/bulk-delete'; refs: WorkspaceArtifactRef[]; now: number }
  | { type: 'tab/open'; tab: WorkspaceTab; now: number }
  | { type: 'tab/activate'; tabId: string; now: number }
  | { type: 'tab/close'; tabId: string; now: number }
  | { type: 'layout/update'; layout: PanelLayout; now: number }
  | { type: 'edge/create'; edge: ManualGraphEdge; now: number }
  | { type: 'edge/delete'; edgeId: string; now: number }
  | { type: 'workspace/replace'; snapshot: WorkspaceSnapshot };

function appendUnique<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some((candidate) => candidate.id === item.id) ? items : [...items, item];
}

function replaceById<T extends { id: string }>(items: T[], item: T): T[] {
  return items.map((candidate) => (candidate.id === item.id ? item : candidate));
}

function removeEntityTabs(tabs: WorkspaceTab[], entityId: string): WorkspaceTab[] {
  return tabs.filter((tab) => tab.entityId !== entityId || tab.pinned);
}

function removeEntityTabsMany(tabs: WorkspaceTab[], entityIds: Set<string>): WorkspaceTab[] {
  return tabs.filter((tab) => tab.entityId === null || !entityIds.has(tab.entityId) || tab.pinned);
}

function safeActiveTab(tabs: WorkspaceTab[], requested: string): string {
  if (tabs.some((tab) => tab.id === requested)) {
    return requested;
  }
  return tabs[0]?.id ?? 'tab-home';
}

function folderExists(folders: WorkspaceFolder[], folderId: string | null): boolean {
  return folderId === null || folders.some((folder) => folder.id === folderId);
}

function refIds(refs: WorkspaceArtifactRef[], kind: WorkspaceArtifactRef['kind']): Set<string> {
  return new Set(refs.filter((ref) => ref.kind === kind).map((ref) => ref.id));
}

export function workspaceReducer(state: WorkspaceSnapshot, action: WorkspaceAction): WorkspaceSnapshot {
  switch (action.type) {
    case 'folder/create':
      if (
        state.folders.some((folder) => folder.id === action.folder.id) ||
        !folderExists(state.folders, action.folder.parentId)
      ) {
        return state;
      }
      return {
        ...state,
        folders: [...state.folders, action.folder],
        updatedAt: Math.max(state.updatedAt, action.folder.updatedAt),
      };

    case 'folder/update': {
      const current = state.folders.find((folder) => folder.id === action.folder.id);
      if (current === undefined) return state;
      if (
        action.folder.parentId !== current.parentId &&
        !canMoveFolder(state.folders, action.folder.id, action.folder.parentId)
      ) {
        return state;
      }
      return {
        ...state,
        folders: replaceById(state.folders, { ...action.folder, updatedAt: action.now }),
        updatedAt: action.now,
      };
    }

    case 'folder/toggle':
      return {
        ...state,
        folders: state.folders.map((folder) =>
          folder.id === action.folderId
            ? { ...folder, collapsed: !folder.collapsed, updatedAt: action.now }
            : folder,
        ),
        updatedAt: action.now,
      };

    case 'folder/delete': {
      const removed = state.folders.find((folder) => folder.id === action.folderId);
      if (removed === undefined) return state;
      const replacementParent = removed.parentId;
      return {
        ...state,
        folders: state.folders
          .filter((folder) => folder.id !== action.folderId)
          .map((folder) =>
            folder.parentId === action.folderId
              ? { ...folder, parentId: replacementParent, updatedAt: action.now }
              : folder,
          ),
        chatRefs: state.chatRefs.map((chat) =>
          chat.folderId === action.folderId
            ? { ...chat, folderId: replacementParent, updatedAt: action.now }
            : chat,
        ),
        notes: state.notes.map((note) =>
          note.folderId === action.folderId
            ? { ...note, folderId: replacementParent, updatedAt: action.now }
            : note,
        ),
        updatedAt: action.now,
      };
    }

    case 'chat/create':
      if (!folderExists(state.folders, action.chat.folderId)) return state;
      return {
        ...state,
        chatRefs: appendUnique(state.chatRefs, action.chat),
        updatedAt: Math.max(state.updatedAt, action.chat.updatedAt),
      };

    case 'chat/update':
      if (!folderExists(state.folders, action.chat.folderId)) return state;
      return {
        ...state,
        chatRefs: replaceById(state.chatRefs, { ...action.chat, updatedAt: action.now }),
        updatedAt: action.now,
      };

    case 'chat/delete': {
      const tabs = removeEntityTabs(state.tabs, action.chatId);
      return {
        ...state,
        chatRefs: state.chatRefs.filter((chat) => chat.id !== action.chatId),
        notes: state.notes.map((note) => ({
          ...note,
          linkedChatIds: note.linkedChatIds.filter((chatId) => chatId !== action.chatId),
        })),
        manualEdges: state.manualEdges.filter(
          (edge) => edge.sourceEntityId !== action.chatId && edge.targetEntityId !== action.chatId,
        ),
        tabs,
        activeTabId: safeActiveTab(tabs, state.activeTabId),
        updatedAt: action.now,
      };
    }

    case 'note/create':
      if (!folderExists(state.folders, action.note.folderId)) return state;
      return {
        ...state,
        notes: appendUnique(state.notes, action.note),
        updatedAt: Math.max(state.updatedAt, action.note.updatedAt),
      };

    case 'note/update':
      if (!folderExists(state.folders, action.note.folderId)) return state;
      return {
        ...state,
        notes: replaceById(state.notes, { ...action.note, updatedAt: action.now }),
        updatedAt: action.now,
      };

    case 'note/delete': {
      const tabs = removeEntityTabs(state.tabs, action.noteId);
      return {
        ...state,
        notes: state.notes.filter((note) => note.id !== action.noteId),
        manualEdges: state.manualEdges.filter(
          (edge) => edge.sourceEntityId !== action.noteId && edge.targetEntityId !== action.noteId,
        ),
        tabs,
        activeTabId: safeActiveTab(tabs, state.activeTabId),
        updatedAt: action.now,
      };
    }

    case 'note/link-chat': {
      if (!state.chatRefs.some((chat) => chat.id === action.chatId)) return state;
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.noteId && !note.linkedChatIds.includes(action.chatId)
            ? { ...note, linkedChatIds: [...note.linkedChatIds, action.chatId], updatedAt: action.now }
            : note,
        ),
        updatedAt: action.now,
      };
    }

    case 'artifact/bulk-move': {
      if (!folderExists(state.folders, action.folderId)) return state;
      const chatIds = refIds(action.refs, 'chat');
      const noteIds = refIds(action.refs, 'note');
      return {
        ...state,
        chatRefs: state.chatRefs.map((chat) =>
          chatIds.has(chat.id) ? { ...chat, folderId: action.folderId, updatedAt: action.now } : chat,
        ),
        notes: state.notes.map((note) =>
          noteIds.has(note.id) ? { ...note, folderId: action.folderId, updatedAt: action.now } : note,
        ),
        updatedAt: action.now,
      };
    }

    case 'artifact/bulk-pin': {
      const chatIds = refIds(action.refs, 'chat');
      return {
        ...state,
        chatRefs: state.chatRefs.map((chat) =>
          chatIds.has(chat.id) ? { ...chat, pinned: action.pinned, updatedAt: action.now } : chat,
        ),
        updatedAt: action.now,
      };
    }

    case 'artifact/bulk-archive': {
      const chatIds = refIds(action.refs, 'chat');
      const noteIds = refIds(action.refs, 'note');
      const affected = new Set([...chatIds, ...noteIds]);
      const tabs = action.archivedAt === null ? state.tabs : removeEntityTabsMany(state.tabs, affected);
      return {
        ...state,
        chatRefs: state.chatRefs.map((chat) =>
          chatIds.has(chat.id) ? { ...chat, archivedAt: action.archivedAt, updatedAt: action.now } : chat,
        ),
        notes: state.notes.map((note) =>
          noteIds.has(note.id) ? { ...note, archivedAt: action.archivedAt, updatedAt: action.now } : note,
        ),
        tabs,
        activeTabId: safeActiveTab(tabs, state.activeTabId),
        updatedAt: action.now,
      };
    }

    case 'artifact/bulk-delete': {
      const chatIds = refIds(action.refs, 'chat');
      const noteIds = refIds(action.refs, 'note');
      const deletedIds = new Set([...chatIds, ...noteIds]);
      const tabs = removeEntityTabsMany(state.tabs, deletedIds);
      return {
        ...state,
        chatRefs: state.chatRefs.filter((chat) => !chatIds.has(chat.id)),
        notes: state.notes
          .filter((note) => !noteIds.has(note.id))
          .map((note) => ({
            ...note,
            linkedChatIds: note.linkedChatIds.filter((chatId) => !chatIds.has(chatId)),
          })),
        manualEdges: state.manualEdges.filter(
          (edge) => !deletedIds.has(edge.sourceEntityId) && !deletedIds.has(edge.targetEntityId),
        ),
        tabs,
        activeTabId: safeActiveTab(tabs, state.activeTabId),
        updatedAt: action.now,
      };
    }

    case 'tab/open': {
      const existing = state.tabs.some((tab) => tab.id === action.tab.id);
      const tabs = existing ? replaceById(state.tabs, action.tab) : [...state.tabs, action.tab];
      return { ...state, tabs, activeTabId: action.tab.id, updatedAt: action.now };
    }

    case 'tab/activate':
      return state.tabs.some((tab) => tab.id === action.tabId)
        ? { ...state, activeTabId: action.tabId, updatedAt: action.now }
        : state;

    case 'tab/close': {
      const target = state.tabs.find((tab) => tab.id === action.tabId);
      if (target === undefined || target.pinned) return state;
      const tabs = state.tabs.filter((tab) => tab.id !== action.tabId);
      return {
        ...state,
        tabs,
        activeTabId: state.activeTabId === action.tabId ? safeActiveTab(tabs, 'tab-home') : state.activeTabId,
        updatedAt: action.now,
      };
    }

    case 'layout/update':
      return { ...state, layout: action.layout, updatedAt: action.now };

    case 'edge/create':
      return {
        ...state,
        manualEdges: appendUnique(state.manualEdges, action.edge),
        updatedAt: action.now,
      };

    case 'edge/delete':
      return {
        ...state,
        manualEdges: state.manualEdges.filter((edge) => edge.id !== action.edgeId),
        updatedAt: action.now,
      };

    case 'workspace/replace':
      return action.snapshot;
  }
}
