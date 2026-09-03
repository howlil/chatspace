import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

import { cn } from '../../ui/cn';

interface SpatialWorkspaceProps {
  tree?: ReactNode;
  surface?: ReactNode;
  treeCollapsed?: boolean;
  treeWidth?: number;
  onTreeWidthChange?: (width: number) => void;
}

const MIN_TREE_WIDTH = 180;
const MAX_TREE_WIDTH = 360;

function clampTreeWidth(width: number): number {
  return Math.min(MAX_TREE_WIDTH, Math.max(MIN_TREE_WIDTH, Math.round(width)));
}

export function SpatialWorkspace({
  tree,
  surface,
  treeCollapsed = false,
  treeWidth = 240,
  onTreeWidthChange = () => undefined,
}: SpatialWorkspaceProps) {
  const lastPointerX = useRef<number | null>(null);
  const normalizedTreeWidth = clampTreeWidth(treeWidth);
  const style = { '--explorer-width': `${normalizedTreeWidth}px` } as CSSProperties;

  function resizeBy(delta: number) {
    onTreeWidthChange(clampTreeWidth(normalizedTreeWidth + delta));
  }

  function handleSeparatorKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      resizeBy(-16);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      resizeBy(16);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    lastPointerX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (lastPointerX.current === null) return;
    const delta = event.clientX - lastPointerX.current;
    lastPointerX.current = event.clientX;
    resizeBy(delta);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    lastPointerX.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      className={cn(
        'relative grid h-full min-h-0 overflow-hidden bg-cs-bg',
        treeCollapsed
          ? 'grid-cols-1'
          : 'grid-cols-[var(--explorer-width)_4px_minmax(0,1fr)] max-[520px]:grid-cols-1',
      )}
      data-tree-collapsed={treeCollapsed ? 'true' : 'false'}
      style={style}
    >
      {!treeCollapsed && (
        <nav
          className="min-h-0 overflow-hidden border-r border-cs-border bg-cs-panel max-[520px]:absolute max-[520px]:inset-y-0 max-[520px]:left-0 max-[520px]:z-20 max-[520px]:w-[min(84vw,320px)] max-[520px]:shadow-2xl"
          aria-label="Workspace library"
        >
          {tree ?? <p className="p-3 text-[11px] text-cs-muted">Folders, chats, and notes appear here.</p>}
        </nav>
      )}
      {!treeCollapsed && (
        <div
          className="group relative z-10 cursor-col-resize bg-transparent outline-none transition-colors hover:bg-cs-hover focus-visible:bg-cs-active max-[520px]:hidden"
          role="separator"
          aria-label="Resize library"
          aria-orientation="vertical"
          aria-valuemin={MIN_TREE_WIDTH}
          aria-valuemax={MAX_TREE_WIDTH}
          aria-valuenow={normalizedTreeWidth}
          tabIndex={0}
          onKeyDown={handleSeparatorKey}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent group-hover:bg-cs-focus/30" />
        </div>
      )}
      <main className="min-h-0 min-w-0 overflow-hidden bg-cs-bg" aria-label="Chatspace workspace">
        {surface ?? (
          <section className="mx-auto max-w-xl p-5">
            <strong className="text-sm">Local workspace</strong>
            <p className="mt-1 text-[11px] leading-5 text-cs-muted">
              Open notes, graph views, and saved conversation references here.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
