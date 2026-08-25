import type {
  ChatReference,
  LocalNote,
  ManualGraphEdge,
  PanelLayout,
  WorkspaceFolder,
  WorkspaceSnapshot,
  WorkspaceTab,
} from './model';

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

function safeActiveTab(tabs: WorkspaceTab[], requested: string): string {
  if (tabs.some((tab) => tab.id === requested)) {
    return requested;
  }
  return tabs[0]?.id ?? 'tab-home';
}

export function workspaceReducer(state: WorkspaceSnapshot, action: WorkspaceAction): WorkspaceSnapshot {
  switch (action.type) {
    case 'folder/create':
      return {
        ...state,
        folders: appendUnique(state.folders, action.folder),
        updatedAt: Math.max(state.updatedAt, action.folder.updatedAt),
      };

    case 'folder/update':
      return {
        ...state,
        folders: replaceById(state.folders, { ...action.folder, updatedAt: action.now }),
        updatedAt: action.now,
      };

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
      if (removed === undefined) {
        return state;
      }
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
      return {
        ...state,
        chatRefs: appendUnique(state.chatRefs, action.chat),
        updatedAt: Math.max(state.updatedAt, action.chat.updatedAt),
      };

    case 'chat/update':
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
      return {
        ...state,
        notes: appendUnique(state.notes, action.note),
        updatedAt: Math.max(state.updatedAt, action.note.updatedAt),
      };

    case 'note/update':
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
      if (!state.chatRefs.some((chat) => chat.id === action.chatId)) {
        return state;
      }
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
      if (target === undefined || target.pinned) {
        return state;
      }
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
