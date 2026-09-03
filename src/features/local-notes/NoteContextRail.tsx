import type { NoteLinkToken } from '../../domain/notes/noteLinks';
import type { LocalNote } from '../../domain/workspace/model';
import { RelatedNotesPanel } from '../local-relations/RelatedNotesPanel';
import { NoteLinksPanel } from './NoteLinksPanel';
import { NotePropertiesPanel } from './NotePropertiesPanel';

interface NoteContextRailProps {
  note: LocalNote;
  notes: LocalNote[];
  onChangeNote: (note: LocalNote) => void;
  onOpenNote: (note: LocalNote) => void;
  onCreateMissingLink?: (title: string) => void;
  onReplaceBrokenLink?: (token: NoteLinkToken, target: LocalNote) => void;
}

export function NoteContextRail({
  note,
  notes,
  onChangeNote,
  onOpenNote,
  onCreateMissingLink,
  onReplaceBrokenLink,
}: NoteContextRailProps) {
  return (
    <aside className="grid content-start gap-3 p-3 min-[880px]:border-l min-[880px]:border-cs-border max-[879px]:max-h-[25dvh] max-[879px]:overflow-y-auto max-[879px]:border-t max-[879px]:border-cs-border">
      <NotePropertiesPanel note={note} onChange={onChangeNote} />
      <NoteLinksPanel
        note={note}
        notes={notes}
        onOpenNote={onOpenNote}
        onCreateMissingLink={onCreateMissingLink}
        onReplaceBrokenLink={onReplaceBrokenLink}
      />
      <RelatedNotesPanel noteId={note.id} notes={notes} onOpenNote={onOpenNote} />
    </aside>
  );
}