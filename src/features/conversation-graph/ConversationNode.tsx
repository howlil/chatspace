import type { ConversationGraphNode } from '../../domain/conversation/model';
import { cn } from '../../ui/cn';

export function ConversationNode({
  item,
  selected,
  sourceActive,
  muted,
  collapsed,
  onSelect,
}: {
  item: { node: ConversationGraphNode; x: number; y: number };
  selected: boolean;
  sourceActive: boolean;
  muted: boolean;
  collapsed: boolean;
  onSelect: () => void;
}) {
  const { node, x, y } = item;
  return (
    <button
      type="button"
      data-conversation-node="true"
      data-node-id={node.id}
      aria-label={`${node.kind} ${node.label}`}
      aria-pressed={selected}
      className={cn(
        'absolute grid min-w-36 max-w-48 -translate-x-1/2 -translate-y-1/2 gap-1 rounded-lg border px-3 py-2 text-left shadow-lg outline-none transition-[opacity,filter,box-shadow,width] duration-150 hover:brightness-105 focus-visible:ring-1 focus-visible:ring-cs-focus/50',
        collapsed && 'min-w-24 max-w-28 px-2 py-1.5',
        node.kind === 'conversation' ? 'border-cs-focus/45 bg-cs-active' : 'border-cs-border bg-cs-surface',
        selected && 'ring-2 ring-cs-focus/60',
        sourceActive && !selected && 'ring-1 ring-cs-focus/70',
        muted && 'opacity-20',
      )}
      style={{ left: x, top: y }}
      onClick={onSelect}
    >
      <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-cs-subtle">{node.kind}</span>
      <span className="truncate text-[11px] font-medium text-cs-text">{node.label}</span>
      {node.kind === 'turn' && <span className="text-[9px] text-cs-subtle">{collapsed ? 'collapsed' : 'turn source'}</span>}
      {node.isStreaming === true && <span className="text-[9px] text-cs-focus">generating…</span>}
    </button>
  );
}
