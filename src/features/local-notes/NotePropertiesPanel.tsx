import { Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { LocalNote } from '../../domain/workspace/model';
import {
  formatPropertyValue,
  parsePropertyValue,
  propertyValueType,
  type PropertyEditorType,
} from '../../domain/workspace/structuredKnowledge';
import { Button, Input, SectionLabel, Select } from '../../ui/primitives';

interface NotePropertiesPanelProps {
  note: LocalNote;
  onChange: (note: LocalNote) => void;
}

const TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'tags', label: 'Tags' },
  { value: 'date', label: 'Date' },
];

export function NotePropertiesPanel({ note, onChange }: NotePropertiesPanelProps) {
  const [keyDraft, setKeyDraft] = useState('');
  const [typeDraft, setTypeDraft] = useState<PropertyEditorType>('text');
  const [valueDraft, setValueDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const entries = Object.entries(note.properties).sort(([left], [right]) => left.localeCompare(right));

  function saveProperty(): void {
    const key = keyDraft.trim().replace(/\s+/g, ' ').slice(0, 64);
    if (key === '') {
      setError('Property name is required.');
      return;
    }
    try {
      const value = parsePropertyValue(typeDraft, valueDraft);
      onChange({ ...note, properties: { ...note.properties, [key]: value } });
      setKeyDraft('');
      setValueDraft('');
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid property value.');
    }
  }

  return (
    <section className="grid gap-2 border-b border-cs-border pb-3" aria-label="Note properties">
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal size={11} className="text-cs-subtle" aria-hidden="true" />
        <SectionLabel>Properties</SectionLabel>
        <span className="ml-auto text-[8px] tabular-nums text-cs-subtle">{entries.length}</span>
      </div>

      <div className="grid gap-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[9px] hover:bg-cs-hover">
            <span className="min-w-0 flex-1 truncate text-cs-muted">{key}</span>
            <span className="max-w-[46%] truncate text-cs-text" title={formatPropertyValue(value)}>{formatPropertyValue(value)}</span>
            <span className="shrink-0 text-[8px] text-cs-subtle">{propertyValueType(value)}</span>
            <button
              type="button"
              className="grid size-5 shrink-0 place-items-center rounded text-cs-subtle outline-none hover:bg-cs-active hover:text-cs-text focus-visible:ring-1 focus-visible:ring-cs-focus/50"
              aria-label={`Remove property ${key}`}
              onClick={() => {
                const properties = { ...note.properties };
                delete properties[key];
                onChange({ ...note, properties });
              }}
            >
              <Trash2 size={8} aria-hidden="true" />
            </button>
          </div>
        ))}
        {entries.length === 0 && <span className="px-1.5 py-1 text-[9px] text-cs-subtle">No structured properties.</span>}
      </div>

      <div className="grid gap-1.5 rounded-md border border-cs-border/70 bg-cs-panel/40 p-1.5">
        <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-1.5">
          <Input
            className="h-7 text-[9px]"
            aria-label="Property name"
            placeholder="status"
            value={keyDraft}
            onChange={(event) => setKeyDraft(event.target.value)}
          />
          <Select
            className="h-7 text-[9px]"
            aria-label="Property type"
            value={typeDraft}
            options={TYPE_OPTIONS}
            onValueChange={(value) => {
              if (value === 'text' || value === 'number' || value === 'boolean' || value === 'tags' || value === 'date') {
                setTypeDraft(value);
                setValueDraft(value === 'boolean' ? 'true' : '');
                setError(null);
              }
            }}
          />
        </div>
        <div className="flex gap-1.5">
          {typeDraft === 'boolean' ? (
            <Select
              className="h-7 min-w-0 flex-1 text-[9px]"
              aria-label="Property value"
              value={valueDraft === 'false' ? 'false' : 'true'}
              options={[{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }]}
              onValueChange={setValueDraft}
            />
          ) : (
            <Input
              className="h-7 min-w-0 flex-1 text-[9px]"
              aria-label="Property value"
              type={typeDraft === 'date' ? 'date' : 'text'}
              placeholder={typeDraft === 'tags' ? 'backend, distributed' : typeDraft === 'number' ? '1' : 'value'}
              value={valueDraft}
              onChange={(event) => setValueDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  saveProperty();
                }
              }}
            />
          )}
          <Button size="sm" variant="ghost" className="h-7 px-1.5 text-[8px]" onClick={saveProperty}>
            <Plus size={8} aria-hidden="true" /> Set
          </Button>
        </div>
        {error !== null && <span className="px-0.5 text-[8px] text-cs-danger" role="alert">{error}</span>}
      </div>
    </section>
  );
}