import { ArrowDownLeft, ArrowUpRight, CircleAlert, Link2 } from 'lucide-react';

import { deriveBacklinks, resolveNoteLinks } from '../../domain/notes/noteLinks';
import type { LocalNote } from '../../domain/workspace/model';
import { Button, SectionLabel } from '../../ui/primitives';

interface NoteLinksPanelProps {
  note: LocalNote;
  notes: LocalNote[];
  onOpenNote: (note: LocalNote) => void;
}

export function NoteLinksPanel({ note, notes, onOpenNote }: NoteLinksPanelProps) {
  const noteById = new Map(notes.map((candidate) => [candidate.id, candidate]));
  const outgoing = resolveNoteLinks(note, notes);
  const backlinks = deriveBacklinks(note.id, notes);

  return (
    <section className="grid gap-2 border-b border-cs-border pb-3" aria-label="Note links">
      <div className="flex items-center gap-1.5">
        <Link2 size={11} className="text-cs-subtle" aria-hidden="true" />
        <SectionLabel>Links</SectionLabel>
      </div>

      <div className="grid gap-1">
        <span className="text-[8px] font-medium uppercase tracking-[0.08em] text-cs-subtle">Outgoing</span>
        {outgoing.map((link, index) => {
          const target = link.targetNoteId === null ? undefined : noteById.get(link.targetNoteId);
          if (link.status === 'resolved' && target !== undefined && target.id !== note.id) {
            return (
              <Button
                key={`${link.token.start}-${target.id}`}
                variant="ghost"
                className="h-7 min-w-0 justify-start gap-1.5 px-1.5 text-[9px] text-cs-muted"
                onClick={() => onOpenNote(target)}
              >
                <ArrowUpRight size={9} className="shrink-0 text-cs-subtle" aria-hidden="true" />
                <span className="truncate">{target.title}</span>
              </Button>
            );
          }
          return (
            <div
              key={`${link.token.start}-${index}`}
              className="flex min-w-0 items-center gap-1.5 px-1.5 py-1 text-[9px] text-cs-subtle"
              title={link.status === 'ambiguous' ? 'Multiple notes have this title.' : 'No note has this title.'}
            >
              <CircleAlert size={9} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{link.token.title}</span>
              <span className="ml-auto shrink-0 text-[8px]">{link.status}</span>
            </div>
          );
        })}
        {outgoing.length === 0 && <span className="px-1.5 py-1 text-[9px] text-cs-subtle">No outgoing note links.</span>}
      </div>

      <div className="grid gap-1">
        <span className="text-[8px] font-medium uppercase tracking-[0.08em] text-cs-subtle">Backlinks</span>
        {backlinks.map((backlink, index) => {
          const source = noteById.get(backlink.sourceNoteId);
          if (source === undefined) return null;
          return (
            <Button
              key={`${backlink.sourceNoteId}-${backlink.token.start}-${index}`}
              variant="ghost"
              className="h-7 min-w-0 justify-start gap-1.5 px-1.5 text-[9px] text-cs-muted"
              onClick={() => onOpenNote(source)}
            >
              <ArrowDownLeft size={9} className="shrink-0 text-cs-subtle" aria-hidden="true" />
              <span className="truncate">{source.title}</span>
            </Button>
          );
        })}
        {backlinks.length === 0 && <span className="px-1.5 py-1 text-[9px] text-cs-subtle">No backlinks yet.</span>}
      </div>
    </section>
  );
}
