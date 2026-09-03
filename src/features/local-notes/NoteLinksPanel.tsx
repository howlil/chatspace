import { ArrowDownLeft, ArrowUpRight, CircleAlert, Link2, Plus } from 'lucide-react';

import {
  deriveBacklinks,
  diagnoseNoteLinks,
  resolveNoteLinks,
  type NoteLinkToken,
} from '../../domain/notes/noteLinks';
import type { LocalNote } from '../../domain/workspace/model';
import { Button, SectionLabel, Select } from '../../ui/primitives';

interface NoteLinksPanelProps {
  note: LocalNote;
  notes: LocalNote[];
  onOpenNote: (note: LocalNote) => void;
  onCreateMissingLink?: ((title: string) => void) | undefined;
  onReplaceBrokenLink?: ((token: NoteLinkToken, target: LocalNote) => void) | undefined;
}

export function NoteLinksPanel({ note, notes, onOpenNote, onCreateMissingLink, onReplaceBrokenLink }: NoteLinksPanelProps) {
  const noteById = new Map(notes.map((candidate) => [candidate.id, candidate]));
  const outgoing = resolveNoteLinks(note, notes);
  const backlinks = deriveBacklinks(note.id, notes);
  const diagnostics = diagnoseNoteLinks(note, notes);
  const replacementOptions = notes.filter((candidate) => candidate.id !== note.id).map((candidate) => ({ value: candidate.id, label: candidate.title }));

  return (
    <section className="grid gap-2 border-b border-cs-border pb-3" aria-label="Note links">
      <div className="flex items-center gap-1.5">
        <Link2 size={11} className="text-cs-subtle" aria-hidden="true" />
        <SectionLabel>Links</SectionLabel>
        <span className="ml-auto text-[8px] tabular-nums text-cs-subtle" aria-label="Link diagnostics">
          {diagnostics.resolved} resolved · {diagnostics.unresolved} unresolved · {diagnostics.ambiguous} ambiguous
        </span>
      </div>

      <div className="grid gap-1">
        <span className="text-[8px] font-medium uppercase tracking-[0.08em] text-cs-subtle">Outgoing</span>
        {outgoing.map((link, index) => {
          const target = link.targetNoteId === null ? undefined : noteById.get(link.targetNoteId);
          if (link.status === 'resolved' && target !== undefined && target.id !== note.id) {
            return (
              <Button key={`${link.token.start}-${target.id}`} variant="ghost" className="h-7 min-w-0 justify-start gap-1.5 px-1.5 text-[9px] text-cs-muted" onClick={() => onOpenNote(target)}>
                <ArrowUpRight size={9} className="shrink-0 text-cs-subtle" aria-hidden="true" />
                <span className="truncate">{link.token.alias ?? target.title}</span>
              </Button>
            );
          }

          return (
            <div key={`${link.token.start}-${index}`} className="grid gap-1 rounded-md border border-cs-border/70 bg-cs-panel/40 px-1.5 py-1.5">
              <div className="flex min-w-0 items-center gap-1.5 text-[9px] text-cs-subtle" title={link.status === 'ambiguous' ? 'Multiple notes have this title.' : 'No note has this title.'}>
                <CircleAlert size={9} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{link.token.title}</span>
                <span className="ml-auto shrink-0 text-[8px]">{link.status}</span>
              </div>
              <div className="flex min-w-0 items-center gap-1">
                {link.status === 'unresolved' && onCreateMissingLink !== undefined && (
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[8px]" onClick={() => onCreateMissingLink(link.token.title)}>
                    <Plus size={8} aria-hidden="true" /> Create
                  </Button>
                )}
                {onReplaceBrokenLink !== undefined && replacementOptions.length > 0 && (
                  <Select
                    className="h-6 min-w-0 flex-1 text-[8px]"
                    aria-label={`Link existing note for ${link.token.title}`}
                    value=""
                    options={[{ value: '', label: 'Link existing…' }, ...replacementOptions]}
                    onValueChange={(value) => {
                      const replacement = notes.find((candidate) => candidate.id === value);
                      if (replacement !== undefined) onReplaceBrokenLink(link.token, replacement);
                    }}
                  />
                )}
              </div>
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
            <Button key={`${backlink.sourceNoteId}-${backlink.token.start}-${index}`} variant="ghost" className="h-7 min-w-0 justify-start gap-1.5 px-1.5 text-[9px] text-cs-muted" onClick={() => onOpenNote(source)}>
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
