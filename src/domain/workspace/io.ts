import { hasValidWorkspaceSemantics } from './integrity';
import {
  WORKSPACE_SCHEMA_VERSION,
  createDefaultNoteTemplates,
  ensureInboxFolder,
  type ChatReference,
  type KnowledgeFilter,
  type LocalNote,
  type ManualGraphEdge,
  type NoteProperties,
  type NoteTemplate,
  type PanelLayout,
  type PropertyValue,
  type SavedKnowledgeView,
  type WorkspaceFolder,
  type WorkspaceSnapshot,
  type WorkspaceTab,
} from './model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string { return typeof value === 'string'; }
function isNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function isNullableNumber(value: unknown): value is number | null { return value === null || isNumber(value); }
function isNullableString(value: unknown): value is string | null { return value === null || isString(value); }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every(isString); }

function isPropertyValue(value: unknown): value is PropertyValue {
  if (isString(value) || isNumber(value) || typeof value === 'boolean' || isStringArray(value)) return true;
  return isRecord(value) && value.type === 'date' && isString(value.value);
}

function isNoteProperties(value: unknown): value is NoteProperties {
  return isRecord(value) && Object.values(value).every(isPropertyValue);
}

function isKnowledgeFilter(value: unknown): value is KnowledgeFilter {
  return isRecord(value) && isString(value.property) && value.property.trim() !== '' && isPropertyValue(value.value);
}

function isSavedView(value: unknown): value is SavedKnowledgeView {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    Array.isArray(value.filters) &&
    value.filters.every(isKnowledgeFilter) &&
    isNumber(value.createdAt) &&
    isNumber(value.updatedAt)
  );
}

function isNoteTemplate(value: unknown): value is NoteTemplate {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.titlePattern) &&
    isString(value.content) &&
    isStringArray(value.tags) &&
    isNoteProperties(value.properties) &&
    isNumber(value.createdAt) &&
    isNumber(value.updatedAt)
  );
}

function isFolder(value: unknown): value is WorkspaceFolder {
  return isRecord(value) && isString(value.id) && isString(value.name) && isNullableString(value.parentId) && typeof value.collapsed === 'boolean' && isNumber(value.createdAt) && isNumber(value.updatedAt);
}

function isChatReferenceBase(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && value.provider === 'chatgpt' && isString(value.target) && isString(value.label) && isNullableString(value.folderId) && typeof value.pinned === 'boolean' && isNumber(value.createdAt) && isNumber(value.updatedAt);
}

function isChatReference(value: unknown): value is ChatReference {
  return isChatReferenceBase(value) && isRecord(value) && isNullableNumber(value.archivedAt);
}

function isLegacyLocalNoteBase(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.title) && isString(value.content) && isStringArray(value.tags) && isNullableString(value.folderId) && isStringArray(value.linkedChatIds) && isNumber(value.createdAt) && isNumber(value.updatedAt);
}

function isLocalNote(value: unknown): value is LocalNote {
  return isLegacyLocalNoteBase(value) && isRecord(value) && isNoteProperties(value.properties) && isNullableNumber(value.archivedAt);
}

function isTab(value: unknown, allowView: boolean): value is WorkspaceTab {
  const validKinds = allowView
    ? new Set(['home', 'chat', 'note', 'graph', 'settings', 'view'])
    : new Set(['home', 'chat', 'note', 'graph', 'settings']);
  return isRecord(value) && isString(value.id) && isString(value.kind) && validKinds.has(value.kind) && isNullableString(value.entityId) && isString(value.title) && typeof value.pinned === 'boolean';
}

function isManualEdge(value: unknown): value is ManualGraphEdge {
  return isRecord(value) && isString(value.id) && isString(value.sourceEntityId) && isString(value.targetEntityId) && value.kind === 'related-manually' && isNumber(value.createdAt);
}

function isPanelLayout(value: unknown): value is PanelLayout {
  return isRecord(value) && typeof value.shellCollapsed === 'boolean' && typeof value.treeCollapsed === 'boolean' && isNumber(value.shellWidth) && isNumber(value.treeWidth);
}

function hasWorkspaceEnvelope(value: Record<string, unknown>, allowView: boolean): boolean {
  return isString(value.id) && isString(value.name) && Array.isArray(value.folders) && value.folders.every(isFolder) && Array.isArray(value.manualEdges) && value.manualEdges.every(isManualEdge) && Array.isArray(value.tabs) && value.tabs.every((tab) => isTab(tab, allowView)) && isString(value.activeTabId) && isPanelLayout(value.layout) && isNumber(value.updatedAt);
}

export function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  const structurallyValid = (
    isRecord(value) &&
    value.schemaVersion === WORKSPACE_SCHEMA_VERSION &&
    hasWorkspaceEnvelope(value, true) &&
    Array.isArray(value.chatRefs) &&
    value.chatRefs.every(isChatReference) &&
    Array.isArray(value.notes) &&
    value.notes.every(isLocalNote) &&
    Array.isArray(value.savedViews) &&
    value.savedViews.every(isSavedView) &&
    Array.isArray(value.noteTemplates) &&
    value.noteTemplates.every(isNoteTemplate)
  );
  return structurallyValid && hasValidWorkspaceSemantics(value as unknown as WorkspaceSnapshot);
}

function migrateLegacyWorkspace(value: Record<string, unknown>): WorkspaceSnapshot | null {
  const version = value.schemaVersion;
  if ((version !== 1 && version !== 2) || !hasWorkspaceEnvelope(value, false)) return null;
  if (!Array.isArray(value.chatRefs) || !value.chatRefs.every(isChatReferenceBase)) return null;
  if (!Array.isArray(value.notes) || !value.notes.every(isLegacyLocalNoteBase)) return null;
  if (version === 2) {
    if (!value.chatRefs.every((chat) => isRecord(chat) && isNullableNumber(chat.archivedAt))) return null;
    if (!value.notes.every((note) => isRecord(note) && isNullableNumber(note.archivedAt))) return null;
  }

  const updatedAt = value.updatedAt as number;
  const migrated: WorkspaceSnapshot = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: value.id as string,
    name: value.name as string,
    folders: value.folders as WorkspaceFolder[],
    chatRefs: (value.chatRefs as Record<string, unknown>[]).map((chat) => ({
      id: chat.id as string,
      provider: 'chatgpt',
      target: chat.target as string,
      label: chat.label as string,
      folderId: chat.folderId as string | null,
      pinned: chat.pinned as boolean,
      archivedAt: version === 2 ? chat.archivedAt as number | null : null,
      createdAt: chat.createdAt as number,
      updatedAt: chat.updatedAt as number,
    })),
    notes: (value.notes as Record<string, unknown>[]).map((note) => ({
      id: note.id as string,
      title: note.title as string,
      content: note.content as string,
      tags: note.tags as string[],
      properties: {},
      folderId: note.folderId as string | null,
      linkedChatIds: note.linkedChatIds as string[],
      archivedAt: version === 2 ? note.archivedAt as number | null : null,
      createdAt: note.createdAt as number,
      updatedAt: note.updatedAt as number,
    })),
    savedViews: [],
    noteTemplates: createDefaultNoteTemplates(updatedAt),
    manualEdges: value.manualEdges as ManualGraphEdge[],
    tabs: value.tabs as WorkspaceTab[],
    activeTabId: value.activeTabId as string,
    layout: value.layout as PanelLayout,
    updatedAt,
  };

  return hasValidWorkspaceSemantics(migrated) ? ensureInboxFolder(migrated) : null;
}

export function migrateWorkspaceSnapshot(value: unknown): WorkspaceSnapshot | null {
  if (isWorkspaceSnapshot(value)) return ensureInboxFolder(value);
  return isRecord(value) ? migrateLegacyWorkspace(value) : null;
}

export function exportWorkspaceJson(snapshot: WorkspaceSnapshot): string { return JSON.stringify(snapshot, null, 2); }

export function importWorkspaceJson(json: string): WorkspaceSnapshot {
  let parsed: unknown;
  try { parsed = JSON.parse(json) as unknown; } catch { throw new Error('Invalid workspace JSON.'); }

  const migrated = migrateWorkspaceSnapshot(parsed);
  if (migrated !== null) return migrated;

  if (isRecord(parsed) && parsed.schemaVersion !== undefined) {
    if (parsed.schemaVersion === 1 || parsed.schemaVersion === 2 || parsed.schemaVersion === WORKSPACE_SCHEMA_VERSION) {
      throw new Error('Invalid workspace payload.');
    }
    throw new Error(`Unsupported workspace schema version: ${String(parsed.schemaVersion)}.`);
  }

  throw new Error('Invalid workspace payload.');
}