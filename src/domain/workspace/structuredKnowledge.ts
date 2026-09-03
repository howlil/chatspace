import {
  createLocalNote,
  type KnowledgeFilter,
  type LocalNote,
  type NoteTemplate,
  type PropertyValue,
  type SavedKnowledgeView,
} from './model';

export type PropertyEditorType = 'text' | 'number' | 'boolean' | 'tags' | 'date';

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function propertyValueKey(value: PropertyValue): string {
  if (typeof value === 'string') return `text:${normalizeText(value)}`;
  if (typeof value === 'number') return `number:${value}`;
  if (typeof value === 'boolean') return `boolean:${value}`;
  if (Array.isArray(value)) return `tags:${[...value].map(normalizeText).sort().join('\u0000')}`;
  return `date:${value.value}`;
}

export function propertyValueEquals(left: PropertyValue, right: PropertyValue): boolean {
  return propertyValueKey(left) === propertyValueKey(right);
}

export function formatPropertyValue(value: PropertyValue): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  return value.value;
}

export function propertyValueType(value: PropertyValue): PropertyEditorType {
  if (typeof value === 'string') return 'text';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'tags';
  return 'date';
}

export function parsePropertyValue(type: PropertyEditorType, input: string): PropertyValue {
  const value = input.trim();
  if (type === 'text') return value;
  if (type === 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error('Property value must be a valid number.');
    return parsed;
  }
  if (type === 'boolean') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error('Boolean property must be true or false.');
  }
  if (type === 'tags') {
    return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Date property must use YYYY-MM-DD.');
  return { type: 'date', value };
}

export function matchesKnowledgeFilters(note: LocalNote, filters: KnowledgeFilter[]): boolean {
  if (note.archivedAt !== null) return false;
  return filters.every((filter) => {
    const actual = note.properties[filter.property];
    return actual !== undefined && propertyValueEquals(actual, filter.value);
  });
}

export function filterKnowledgeNotes(notes: LocalNote[], filters: KnowledgeFilter[]): LocalNote[] {
  return notes.filter((note) => matchesKnowledgeFilters(note, filters));
}

export function knowledgePropertyKeys(notes: LocalNote[]): string[] {
  return [...new Set(notes.flatMap((note) => Object.keys(note.properties)))].sort((left, right) => left.localeCompare(right));
}

export function distinctKnowledgePropertyValues(notes: LocalNote[], property: string): PropertyValue[] {
  const values = new Map<string, PropertyValue>();
  for (const note of notes) {
    const value = note.properties[property];
    if (value !== undefined) values.set(propertyValueKey(value), value);
  }
  return [...values.values()].sort((left, right) => formatPropertyValue(left).localeCompare(formatPropertyValue(right)));
}

export function createSavedKnowledgeView(input: {
  id: string;
  name: string;
  filters: KnowledgeFilter[];
  now: number;
}): SavedKnowledgeView {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (name === '') throw new Error('View name is required.');
  return {
    id: input.id,
    name,
    filters: input.filters.map((filter) => ({ property: filter.property, value: structuredClone(filter.value) })),
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function renderTemplateString(value: string, title: string, date: string): string {
  return value.replaceAll('{{title}}', title).replaceAll('{{date}}', date);
}

function renderTemplateProperty(value: PropertyValue, title: string, date: string): PropertyValue {
  if (typeof value === 'string') return renderTemplateString(value, title, date);
  if (Array.isArray(value)) return value.map((item) => renderTemplateString(item, title, date));
  if (typeof value === 'object') return { type: 'date', value: renderTemplateString(value.value, title, date) };
  return value;
}

export function instantiateNoteTemplate(input: {
  template: NoteTemplate;
  id: string;
  title: string;
  folderId: string | null;
  now: number;
}): LocalNote {
  const title = input.title.trim().replace(/\s+/g, ' ').slice(0, 160) || 'Untitled note';
  const date = new Date(input.now).toISOString().slice(0, 10);
  const renderedTitle = renderTemplateString(input.template.titlePattern, title, date).trim() || title;
  const note = createLocalNote({ id: input.id, title: renderedTitle, folderId: input.folderId, now: input.now });
  return {
    ...note,
    content: renderTemplateString(input.template.content, title, date),
    tags: [...input.template.tags],
    properties: Object.fromEntries(
      Object.entries(input.template.properties).map(([key, value]) => [key, renderTemplateProperty(value, title, date)]),
    ),
  };
}