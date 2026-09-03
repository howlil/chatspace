import { describe, expect, it } from 'vitest';

import { createLocalNote, type NoteTemplate } from './model';
import {
  createSavedKnowledgeView,
  distinctKnowledgePropertyValues,
  filterKnowledgeNotes,
  instantiateNoteTemplate,
  knowledgePropertyKeys,
  parsePropertyValue,
  propertyValueEquals,
} from './structuredKnowledge';

describe('structured knowledge', () => {
  it('supports typed properties and AND-only equality filters', () => {
    const research = {
      ...createLocalNote({ id: 'research', title: 'Storage', folderId: null, now: 1 }),
      properties: {
        status: 'research',
        topic: 'backend',
        priority: 2,
        reviewed: false,
        labels: ['distributed', 'storage'],
        due: { type: 'date' as const, value: '2026-09-30' },
      },
    };
    const done = {
      ...createLocalNote({ id: 'done', title: 'UI', folderId: null, now: 1 }),
      properties: { status: 'done', topic: 'frontend' },
    };

    expect(filterKnowledgeNotes([research, done], [
      { property: 'status', value: 'RESEARCH' },
      { property: 'topic', value: 'backend' },
    ]).map((note) => note.id)).toEqual(['research']);
    expect(propertyValueEquals(['storage', 'distributed'], ['distributed', 'storage'])).toBe(true);
    expect(parsePropertyValue('number', '3.5')).toBe(3.5);
    expect(parsePropertyValue('boolean', 'true')).toBe(true);
    expect(parsePropertyValue('tags', 'backend, distributed, backend')).toEqual(['backend', 'distributed']);
    expect(parsePropertyValue('date', '2026-09-30')).toEqual({ type: 'date', value: '2026-09-30' });
    expect(() => parsePropertyValue('number', 'NaN')).toThrow(/number/i);
    expect(() => parsePropertyValue('date', '30-09-2026')).toThrow(/YYYY-MM-DD/);
  });

  it('derives property keys and typed values from canonical notes without a separate schema registry', () => {
    const one = { ...createLocalNote({ id: 'one', title: 'One', folderId: null, now: 1 }), properties: { status: 'research', score: 2 } };
    const two = { ...createLocalNote({ id: 'two', title: 'Two', folderId: null, now: 1 }), properties: { status: 'done', topic: 'backend' } };

    expect(knowledgePropertyKeys([one, two])).toEqual(['score', 'status', 'topic']);
    expect(distinctKnowledgePropertyValues([one, two], 'status')).toEqual(['done', 'research']);
  });

  it('creates a named saved view as filters only rather than copied items', () => {
    const view = createSavedKnowledgeView({
      id: 'view-research',
      name: '  Research  ',
      filters: [{ property: 'status', value: 'research' }, { property: 'topic', value: 'backend' }],
      now: 5,
    });

    expect(view).toEqual({
      id: 'view-research',
      name: 'Research',
      filters: [{ property: 'status', value: 'research' }, { property: 'topic', value: 'backend' }],
      createdAt: 5,
      updatedAt: 5,
    });
  });

  it('instantiates an explicit template with only title and date variables', () => {
    const template: NoteTemplate = {
      id: 'template-research',
      name: 'Research Note',
      titlePattern: '{{title}} · {{date}}',
      content: '{{title}}\n{{date}}\n{{unknown}}',
      tags: [],
      properties: {
        type: 'research',
        status: 'active',
        started: { type: 'date', value: '{{date}}' },
      },
      createdAt: 1,
      updatedAt: 1,
    };
    const note = instantiateNoteTemplate({
      template,
      id: 'note-research',
      title: 'TCP',
      folderId: null,
      now: Date.UTC(2026, 8, 3, 12),
    });

    expect(note.title).toBe('TCP · 2026-09-03');
    expect(note.content).toBe('TCP\n2026-09-03\n{{unknown}}');
    expect(note.properties).toEqual({
      type: 'research',
      status: 'active',
      started: { type: 'date', value: '2026-09-03' },
    });
  });
});
