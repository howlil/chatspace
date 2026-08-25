import { ArrowUpRight, Network } from 'lucide-react';

import { deriveLocalNoteRelations } from '../../domain/graph/localRelations';
import type { LocalNote } from '../../domain/workspace/model';
import { Panel, SectionLabel } from '../../ui/primitives';

interface RelatedNotesPanelProps {
  noteId: string;
  notes: LocalNote[];
  onOpenNote: (note: LocalNote) => void;
}

export function RelatedNotesPanel({ noteId, notes, onOpenNote }: RelatedNotesPanelProps) {
  const noteById = new Map(notes.map((note) => [note.id, note]));
  const candidates = deriveLocalNoteRelations(notes)
    .filter((relation) => relation.sourceNoteId === noteId || relation.targetNoteId === noteId)
    .map((relation) => {
      const relatedId = relation.sourceNoteId === noteId ? relation.targetNoteId : relation.sourceNoteId;
      return { relation, note: noteById.get(relatedId) };
    })
    .filter((candidate): candidate is { relation: typeof candidate.relation; note: LocalNote } =>
      candidate.note !== undefined,
    )
    .sort(
      (left, right) =>
        right.relation.score - left.relation.score || left.note.title.localeCompare(right.note.title),
    );

  return (
    <section aria-label="Related local notes">
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <SectionLabel>Related locally</SectionLabel>
        <span className="text-[8px] text-cs-subtle">Deterministic · local-only</span>
      </div>
      <Panel className="overflow-hidden p-1">
        {candidates.length === 0 ? (
          <div className="grid min-h-24 place-items-center px-4 py-5 text-center">
            <div className="grid justify-items-center gap-1.5 text-cs-subtle">
              <Network size={14} strokeWidth={1.6} aria-hidden="true" />
              <p className="m-0 text-[9px] leading-4">No explainable local relationship yet.</p>
            </div>
          </div>
        ) : (
          candidates.map(({ relation, note }) => (
            <button
              type="button"
              className="group flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-cs-hover focus-visible:bg-cs-active"
              key={note.id}
              onClick={() => onOpenNote(note)}
            >
              <span className="grid min-w-0 flex-1 gap-0.5">
                <strong className="truncate text-[10px] font-medium text-cs-text">{note.title}</strong>
                <small className="truncate text-[8px] text-cs-subtle">
                  {Math.round(relation.score * 100)}% · {relation.sharedTerms.slice(0, 5).join(', ')}
                </small>
              </span>
              <ArrowUpRight className="shrink-0 text-cs-subtle group-hover:text-cs-muted" size={11} aria-hidden="true" />
            </button>
          ))
        )}
      </Panel>
    </section>
  );
}
