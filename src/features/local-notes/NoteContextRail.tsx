import type { LocalNote } from '../../domain/workspace/model';
import { RelatedNotesPanel } from '../local-relations/RelatedNotesPanel';

interface NoteContextRailProps {
  note: LocalNote;
  notes: LocalNote[];
  onOpenNote: (note: LocalNote) => void;
}

export function NoteContextRail({ note, notes, onOpenNote }: NoteContextRailProps) {
  return (
    <aside className="grid content-start p-3 min-[880px]:border-l min-[880px]:border-cs-border max-[879px]:max-h-[25dvh] max-[879px]:overflow-y-auto max-[879px]:border-t max-[879px]:border-cs-border">
      <RelatedNotesPanel noteId={note.id} notes={notes} onOpenNote={onOpenNote} />
    </aside>
  );
}
