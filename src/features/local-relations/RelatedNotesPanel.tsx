import { deriveLocalNoteRelations } from '../../domain/graph/localRelations';
import type { LocalNote } from '../../domain/workspace/model';

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
    .sort((left, right) => right.relation.score - left.relation.score || left.note.title.localeCompare(right.note.title));

  return (
    <section className="related-notes-panel" aria-label="Related local notes">
      <div className="related-notes-heading">
        <strong>Related locally</strong>
        <span>Deterministic · local-only</span>
      </div>
      {candidates.length === 0 ? (
        <p>No explainable local relationship yet.</p>
      ) : (
        <div className="related-notes-list">
          {candidates.map(({ relation, note }) => (
            <button type="button" key={note.id} onClick={() => onOpenNote(note)}>
              <span>{note.title}</span>
              <small>
                {Math.round(relation.score * 100)}% · {relation.sharedTerms.slice(0, 4).join(', ')}
              </small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
