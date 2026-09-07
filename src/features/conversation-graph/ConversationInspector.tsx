import { ExternalLink, Pin, StickyNote } from 'lucide-react';

import type { ConversationAnnotation, ConversationGraphNode, ConversationSnapshot } from '../../domain/conversation/model';
import { Button, SectionLabel, Textarea } from '../../ui/primitives';

export function ConversationInspector({
  node,
  snapshot,
  annotation,
  onGoToSource,
  onTogglePin,
  onSaveAnnotation,
}: {
  node: ConversationGraphNode | undefined;
  snapshot: ConversationSnapshot;
  annotation: ConversationAnnotation | undefined;
  onGoToSource: (sourceId: string) => void;
  onTogglePin: () => void;
  onSaveAnnotation: (note: string) => void;
}) {
  if (node === undefined) return <div className="grid min-h-32 place-items-center p-4 text-center text-[10px] text-cs-subtle">Select a turn to inspect its source.</div>;
  const turn = snapshot.turns.find((item) => item.id === node.turnId);
  const sourceId = node.sourceIds[0];
  const responseCount = turn?.responseMessageIds.length ?? 0;

  return (
    <div className="grid content-start gap-3 overflow-y-auto border-l border-cs-border bg-cs-panel p-3 max-[720px]:max-h-64 max-[720px]:border-l-0 max-[720px]:border-t" aria-label="Conversation selection details">
      <div className="grid gap-1.5">
        <SectionLabel>Selected turn</SectionLabel>
        <strong className="text-[12px] font-medium leading-4">{node.label}</strong>
        <span className="text-[9px] text-cs-subtle">1 prompt · {responseCount} {responseCount === 1 ? 'response' : 'responses'}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {sourceId !== undefined && <Button size="sm" onClick={() => onGoToSource(sourceId)}><ExternalLink size={11} aria-hidden="true" /> Go to source</Button>}
        <Button variant={annotation?.pinned === true ? 'primary' : 'ghost'} className="h-7 px-2 text-[10px]" onClick={onTogglePin}><Pin size={11} aria-hidden="true" /> {annotation?.pinned === true ? 'Pinned' : 'Pin'}</Button>
      </div>
      <label className="grid gap-1">
        <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-cs-subtle"><StickyNote size={10} aria-hidden="true" /> Annotation</span>
        <Textarea defaultValue={annotation?.note ?? ''} key={`${node.id}:${annotation?.updatedAt ?? 0}`} placeholder="Add a local note for this source…" rows={4} onBlur={(event) => onSaveAnnotation(event.currentTarget.value)} />
      </label>
    </div>
  );
}
