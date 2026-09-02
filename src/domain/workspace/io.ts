import { hasValidWorkspaceSemantics } from './integrity';
import {
  WORKSPACE_SCHEMA_VERSION,
  type ChatReference,
  type LocalNote,
  type ManualGraphEdge,
  type PanelLayout,
  type WorkspaceFolder,
  type WorkspaceSnapshot,
  type WorkspaceTab,
} from './model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isFolder(value: unknown): value is WorkspaceFolder {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isNullableString(value.parentId) &&
    typeof value.collapsed === 'boolean' &&
    isNumber(value.createdAt) &&
    isNumber(value.updatedAt)
  );
}

function isChatReferenceBase(value: unknown): value is Omit<ChatReference, 'archivedAt'> & { archivedAt?: unknown } {
  return (
    isRecord(value) &&
    isString(value.id) &&
    value.provider === 'chatgpt' &&
    isString(value.target) &&
    isString(value.label) &&
    isNullableString(value.folderId) &&
    typeof value.pinned === 'boolean' &&
    isNumber(value.createdAt) &&
    isNumber(value.updatedAt)
  );
}

function isChatReference(value: unknown): value is ChatReference {
  return isChatReferenceBase(value) && isNullableNumber(value.archivedAt);
}

function isLocalNoteBase(value: unknown): value is Omit<LocalNote, 'archivedAt'> & { archivedAt?: unknown } {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.content) &&
    isStringArray(value.tags) &&
    isNullableString(value.folderId) &&
    isStringArray(value.linkedChatIds) &&
    isNumber(value.createdAt) &&
    isNumber(value.updatedAt)
  );
}

function isLocalNote(value: unknown): value is LocalNote {
  return isLocalNoteBase(value) && isNullableNumber(value.archivedAt);
}

function isTab(value: unknown): value is WorkspaceTab {
  const validKinds = new Set(['home', 'chat', 'note', 'graph', 'settings']);
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.kind) &&
    validKinds.has(value.kind) &&
    isNullableString(value.entityId) &&
    isString(value.title) &&
    typeof value.pinned === 'boolean'
  );
}

function isManualEdge(value: unknown): value is ManualGraphEdge {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.sourceEntityId) &&
    isString(value.targetEntityId) &&
    value.kind === 'related-manually' &&
    isNumber(value.createdAt)
  );
}

function isPanelLayout(value: unknown): value is PanelLayout {
  return (
    isRecord(value) &&
    typeof value.shellCollapsed === 'boolean' &&
    typeof value.treeCollapsed === 'boolean' &&
    isNumber(value.shellWidth) &&
    isNumber(value.treeWidth)
  );
}

function hasWorkspaceEnvelope(value: Record<string, unknown>): boolean {
  return (
    isString(value.id) &&
    isString(value.name) &&
    Array.isArray(value.folders) &&
    value.folders.every(isFolder) &&
    Array.isArray(value.manualEdges) &&
    value.manualEdges.every(isManualEdge) &&
    Array.isArray(value.tabs) &&
    value.tabs.every(isTab) &&
    isString(value.activeTabId) &&
    isPanelLayout(value.layout) &&
    isNumber(value.updatedAt)
  );
}

export function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  const structurallyValid = (
    isRecord(value) &&
    value.schemaVersion === WORKSPACE_SCHEMA_VERSION &&
    hasWorkspaceEnvelope(value) &&
    Array.isArray(value.chatRefs) &&
    value.chatRefs.every(isChatReference) &&
    Array.isArray(value.notes) &&
    value.notes.every(isLocalNote)
  );

  return structurallyValid && hasValidWorkspaceSemantics(value as WorkspaceSnapshot);
}

function migrateV1Workspace(value: Record<string, unknown>): WorkspaceSnapshot | null {
  if (
    value.schemaVersion !== 1 ||
    !hasWorkspaceEnvelope(value) ||
    !Array.isArray(value.chatRefs) ||
    !value.chatRefs.every(isChatReferenceBase) ||
    !Array.isArray(value.notes) ||
    !value.notes.every(isLocalNoteBase)
  ) {
    return null;
  }

  const migrated: WorkspaceSnapshot = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: value.id as string,
    name: value.name as string,
    folders: value.folders as WorkspaceFolder[],
    chatRefs: (value.chatRefs as Array<Omit<ChatReference, 'archivedAt'>>).map((chat) => ({ ...chat, archivedAt: null })),
    notes: (value.notes as Array<Omit<LocalNote, 'archivedAt'>>).map((note) => ({ ...note, archivedAt: null })),
    manualEdges: value.manualEdges as ManualGraphEdge[],
    tabs: value.tabs as WorkspaceTab[],
    activeTabId: value.activeTabId as string,
    layout: value.layout as PanelLayout,
    updatedAt: value.updatedAt as number,
  };

  return hasValidWorkspaceSemantics(migrated) ? migrated : null;
}

export function migrateWorkspaceSnapshot(value: unknown): WorkspaceSnapshot | null {
  if (isWorkspaceSnapshot(value)) return value;
  return isRecord(value) ? migrateV1Workspace(value) : null;
}

export function exportWorkspaceJson(snapshot: WorkspaceSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function importWorkspaceJson(json: string): WorkspaceSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new Error('Invalid workspace JSON.');
  }

  const migrated = migrateWorkspaceSnapshot(parsed);
  if (migrated !== null) return migrated;

  if (isRecord(parsed) && parsed.schemaVersion !== undefined) {
    if (parsed.schemaVersion === 1 || parsed.schemaVersion === WORKSPACE_SCHEMA_VERSION) {
      throw new Error('Invalid workspace payload.');
    }
    throw new Error(`Unsupported workspace schema version: ${String(parsed.schemaVersion)}.`);
  }

  throw new Error('Invalid workspace payload.');
}
