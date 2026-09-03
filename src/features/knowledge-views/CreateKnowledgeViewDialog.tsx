import { Filter, Plus, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useMemo, useState } from 'react';

import type { KnowledgeFilter, LocalNote, PropertyValue } from '../../domain/workspace/model';
import {
  distinctKnowledgePropertyValues,
  formatPropertyValue,
  knowledgePropertyKeys,
  propertyValueType,
} from '../../domain/workspace/structuredKnowledge';
import { Button, Input, Select } from '../../ui/primitives';

interface CreateKnowledgeViewDialogProps {
  open: boolean;
  notes: LocalNote[];
  onSave: (name: string, filters: KnowledgeFilter[]) => void;
  onClose: () => void;
}

function valueOption(value: PropertyValue, index: number) {
  return { value: String(index), label: `${formatPropertyValue(value)} · ${propertyValueType(value)}` };
}

export function CreateKnowledgeViewDialog({ open, notes, onSave, onClose }: CreateKnowledgeViewDialogProps) {
  const [name, setName] = useState('');
  const [property, setProperty] = useState('');
  const [valueIndex, setValueIndex] = useState('');
  const [filters, setFilters] = useState<KnowledgeFilter[]>([]);
  const propertyKeys = useMemo(() => knowledgePropertyKeys(notes), [notes]);
  const values = useMemo(() => property === '' ? [] : distinctKnowledgePropertyValues(notes, property), [notes, property]);

  function reset(): void {
    setName('');
    setProperty('');
    setValueIndex('');
    setFilters([]);
  }

  function close(): void {
    reset();
    onClose();
  }

  function addFilter(): void {
    const index = Number(valueIndex);
    const value = values[index];
    if (property === '' || value === undefined) return;
    setFilters((current) => [
      ...current.filter((filter) => filter.property !== property),
      { property, value },
    ]);
    setProperty('');
    setValueIndex('');
  }

  function save(): void {
    const cleanName = name.trim();
    if (cleanName === '' || filters.length === 0) return;
    onSave(cleanName, filters);
    reset();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed left-1/2 top-[18%] z-[60] grid w-[min(92vw,520px)] -translate-x-1/2 gap-3 rounded-xl border border-cs-border bg-cs-surface p-3 shadow-2xl outline-none">
          <div className="flex items-start gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md border border-cs-border bg-cs-panel text-cs-muted"><Filter size={12} aria-hidden="true" /></span>
            <div className="grid gap-0.5">
              <Dialog.Title className="text-[11px] font-medium text-cs-text">New saved view</Dialog.Title>
              <Dialog.Description className="text-[9px] leading-4 text-cs-muted">Save a named projection over canonical notes. Every clause is combined with AND.</Dialog.Description>
            </div>
          </div>

          <Input
            autoFocus
            className="h-8 text-[10px]"
            aria-label="Saved view name"
            placeholder="Research"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          {propertyKeys.length === 0 ? (
            <p className="m-0 rounded-md border border-cs-border bg-cs-panel px-2.5 py-2 text-[9px] leading-4 text-cs-subtle">Add a structured property to a note before creating a view.</p>
          ) : (
            <div className="grid gap-1.5 rounded-lg border border-cs-border bg-cs-panel/55 p-2">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-1.5">
                <Select
                  className="h-7 text-[9px]"
                  aria-label="View filter property"
                  value={property}
                  options={[{ value: '', label: 'Property…' }, ...propertyKeys.map((key) => ({ value: key, label: key }))]}
                  onValueChange={(value) => { setProperty(value); setValueIndex(''); }}
                />
                <Select
                  className="h-7 text-[9px]"
                  aria-label="View filter value"
                  value={valueIndex}
                  options={[{ value: '', label: 'Value…' }, ...values.map(valueOption)]}
                  onValueChange={setValueIndex}
                />
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[8px]" disabled={property === '' || valueIndex === ''} onClick={addFilter}>
                  <Plus size={8} aria-hidden="true" /> Add
                </Button>
              </div>
              {filters.length > 0 && (
                <div className="flex flex-wrap gap-1" aria-label="Saved view filters">
                  {filters.map((filter, index) => (
                    <span key={`${filter.property}-${index}`} className="flex h-6 items-center gap-1 rounded border border-cs-border bg-cs-control pl-1.5 text-[8px] text-cs-muted">
                      {index > 0 && <span className="font-semibold text-cs-subtle">AND</span>}
                      <span>{filter.property} = {formatPropertyValue(filter.value)}</span>
                      <button
                        type="button"
                        className="grid h-full w-5 place-items-center text-cs-subtle hover:text-cs-text"
                        aria-label={`Remove filter ${filter.property}`}
                        onClick={() => setFilters((current) => current.filter((_, filterIndex) => filterIndex !== index))}
                      >
                        <X size={8} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-1.5">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button disabled={name.trim() === '' || filters.length === 0} onClick={save}>Save view</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}