import { CloudUpload, HardDrive } from 'lucide-react';

import type { LocalNote } from '../../domain/workspace/model';
import { Button, Panel, SectionLabel } from '../../ui/primitives';
import { RelatedNotesPanel } from '../local-relations/RelatedNotesPanel';

interface NoteContextRailProps {
  note: LocalNote;
  notes: LocalNote[];
  bridgeConnected: boolean;
  onOpenNote: (note: LocalNote) => void;
  onSync: () => void;
}

export function NoteContextRail({ note, notes, bridgeConnected, onOpenNote, onSync }: NoteContextRailProps) {
  return (
    <aside className="grid content-start gap-4 p-3 min-[880px]:border-l min-[880px]:border-white/[0.06] max-[879px]:border-t max-[879px]:border-white/[0.06]">
      <RelatedNotesPanel noteId={note.id} notes={notes} onOpenNote={onOpenNote} />

      <section className="grid gap-1.5">
        <SectionLabel className="px-1">Local vault</SectionLabel>
        <Panel className="grid gap-2.5 p-2.5">
          <div className="flex items-start gap-2">
            <HardDrive size={12} className="mt-0.5 shrink-0 text-cs-subtle" aria-hidden="true" />
            <div className="grid min-w-0 gap-0.5">
              <strong className="text-[10px] font-medium">Markdown sync</strong>
              <span className="text-[8px] leading-4 text-cs-subtle">
                {bridgeConnected ? 'Bridge connected for this session.' : 'Bridge disconnected. Configure it in Settings.'}
              </span>
            </div>
          </div>
          <Button className="justify-self-start" disabled={!bridgeConnected} onClick={onSync}>
            <CloudUpload size={11} aria-hidden="true" /> Sync to local vault
          </Button>
        </Panel>
      </section>
    </aside>
  );
}
