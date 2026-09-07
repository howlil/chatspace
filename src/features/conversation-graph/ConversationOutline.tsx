import type { ConversationSnapshot } from '../../domain/conversation/model';
import { Button } from '../../ui/primitives';

export function ConversationOutline({
  snapshot,
  selectedTurnId,
  collapsed,
  onSelect,
  onToggleCollapse,
}: {
  snapshot: ConversationSnapshot;
  selectedTurnId: string | undefined;
  collapsed: Set<string>;
  onSelect: (turnId: string) => void;
  onToggleCollapse: (turnId: string) => void;
}) {
  return (
    <div className="grid content-start gap-1 overflow-y-auto p-2" aria-label="Conversation outline">
      {snapshot.turns.map((turn, index) => (
        <div key={turn.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-1 rounded-md border border-transparent px-1.5 py-1 hover:border-cs-border hover:bg-cs-hover">
          <span className="text-right font-mono text-[9px] text-cs-subtle">{String(index + 1).padStart(2, '0')}</span>
          <button
            type="button"
            className="min-w-0 truncate text-left text-[10px] text-cs-muted outline-none focus-visible:text-cs-text"
            data-selected={selectedTurnId === turn.id ? 'true' : 'false'}
            onClick={() => onSelect(turn.id)}
          >
            <span className={selectedTurnId === turn.id ? 'font-medium text-cs-text' : undefined}>{turn.label}</span>
            {turn.isStreaming && <span className="ml-1 text-cs-focus">●</span>}
          </button>
          <Button variant="ghost" className="h-5 px-1 text-[9px]" aria-label={`${collapsed.has(turn.id) ? 'Expand' : 'Collapse'} ${turn.label}`} onClick={() => onToggleCollapse(turn.id)}>
            {collapsed.has(turn.id) ? '＋' : '−'}
          </Button>
        </div>
      ))}
    </div>
  );
}
