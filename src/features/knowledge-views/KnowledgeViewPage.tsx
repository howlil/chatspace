import { FileText, Filter, Trash2 } from 'lucide-react';

import type { LocalNote, SavedKnowledgeView } from '../../domain/workspace/model';
import { filterKnowledgeNotes, formatPropertyValue } from '../../domain/workspace/structuredKnowledge';
import { Button, Panel } from '../../ui/primitives';
import { WorkspaceHeader } from '../../ui/workspace';

interface KnowledgeViewPageProps {
  view: SavedKnowledgeView;
  notes: LocalNote[];
  onOpenNote: (note: LocalNote) => void;
  onDelete: () => void;
}

export function KnowledgeViewPage({ view, notes, onOpenNote, onDelete }: KnowledgeViewPageProps) {
  const matches = filterKnowledgeNotes(notes, view.filters);
  return (
    <section className="h-full min-h-0 overflow-y-auto" aria-label={`Saved view ${view.name}`}>
      <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-5 sm:px-5">
        <WorkspaceHeader icon={Filter} title={view.name} description={`${matches.length} matching note${matches.length === 1 ? '' : 's'} · AND filters`} />

        <div className="flex flex-wrap items-center gap-1">
          {view.filters.map((filter, index) => (
            <span key={`${filter.property}-${index}`} className="rounded border border-cs-border bg-cs-control px-1.5 py-1 text-[8px] text-cs-muted">
              {index > 0 && <strong className="mr-1 font-semibold text-cs-subtle">AND</strong>}
              {filter.property} = {formatPropertyValue(filter.value)}
            </span>
          ))}
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-[8px] text-cs-subtle" onClick={onDelete}>
            <Trash2 size={9} aria-hidden="true" /> Delete view
          </Button>
        </div>

        <Panel className="overflow-hidden p-1">
          {matches.map((note) => (
            <button
              type="button"
              key={note.id}
              className="flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none hover:bg-cs-hover focus-visible:bg-cs-active"
              onClick={() => onOpenNote(note)}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md border border-cs-border bg-cs-surface text-cs-subtle"><FileText size={12} aria-hidden="true" /></span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <strong className="truncate text-[11px] font-medium text-cs-text">{note.title}</strong>
                <small className="truncate text-[8px] text-cs-subtle">{Object.keys(note.properties).length} properties · {note.tags.length} tags</small>
              </span>
            </button>
          ))}
          {matches.length === 0 && <p className="m-0 px-3 py-8 text-center text-[10px] text-cs-subtle">No notes match every saved filter.</p>}
        </Panel>
      </div>
    </section>
  );
}