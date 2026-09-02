export const WORKSPACE_SCHEMA_VERSION = 2 as const;
export const DEFAULT_WORKSPACE_ID = 'default';

export type TabKind = 'home' | 'chat' | 'note' | 'graph' | 'settings';

export interface WorkspaceFolder {
  id: string;
  name: string;
  parentId: string | null;
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatReference {
  id: string;
  provider: 'chatgpt';
  target: string;
  label: string;
  folderId: string | null;
  pinned: boolean;
  archivedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface LocalNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderId: string | null;
  linkedChatIds: string[];
  archivedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceTab {
  id: string;
  kind: TabKind;
  entityId: string | null;
  title: string;
  pinned: boolean;
}

export interface ManualGraphEdge {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  kind: 'related-manually';
  createdAt: number;
}

export interface PanelLayout {
  shellCollapsed: boolean;
  treeCollapsed: boolean;
  shellWidth: number;
  treeWidth: number;
}

export interface WorkspaceSnapshot {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  id: string;
  name: string;
  folders: WorkspaceFolder[];
  chatRefs: ChatReference[];
  notes: LocalNote[];
  manualEdges: ManualGraphEdge[];
  tabs: WorkspaceTab[];
  activeTabId: string;
  layout: PanelLayout;
  updatedAt: number;
}

interface FolderInput {
  id: string;
  name: string;
  parentId: string | null;
  now: number;
}

interface ChatReferenceInput {
  id: string;
  label: string;
  target: string;
  folderId: string | null;
  now: number;
}

interface LocalNoteInput {
  id: string;
  title: string;
  folderId: string | null;
  now: number;
}

function cleanLabel(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/\s+/g, ' ').slice(0, 160);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function createFolder(input: FolderInput): WorkspaceFolder {
  return {
    id: input.id,
    name: cleanLabel(input.name, 'Untitled folder'),
    parentId: input.parentId,
    collapsed: false,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function createChatReference(input: ChatReferenceInput): ChatReference {
  return {
    id: input.id,
    provider: 'chatgpt',
    target: input.target,
    label: cleanLabel(input.label, 'Untitled conversation'),
    folderId: input.folderId,
    pinned: false,
    archivedAt: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function createLocalNote(input: LocalNoteInput): LocalNote {
  return {
    id: input.id,
    title: cleanLabel(input.title, 'Untitled note'),
    content: '',
    tags: [],
    folderId: input.folderId,
    linkedChatIds: [],
    archivedAt: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function createInitialWorkspace(now = Date.now()): WorkspaceSnapshot {
  const homeTab: WorkspaceTab = {
    id: 'tab-home',
    kind: 'home',
    entityId: null,
    title: 'Home',
    pinned: true,
  };

  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: DEFAULT_WORKSPACE_ID,
    name: 'Chatspace',
    folders: [],
    chatRefs: [],
    notes: [],
    manualEdges: [],
    tabs: [homeTab],
    activeTabId: homeTab.id,
    layout: {
      shellCollapsed: false,
      treeCollapsed: false,
      shellWidth: 920,
      treeWidth: 260,
    },
    updatedAt: now,
  };
}

export function createEntityId(prefix: string): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId !== undefined) {
    return `${prefix}-${randomId}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function cleanWorkspaceLabel(value: string, fallback: string): string {
  return cleanLabel(value, fallback);
}
