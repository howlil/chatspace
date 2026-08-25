import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

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
  const style = { '--cs-tree-width': `${normalizedTreeWidth}px` } as CSSProperties;

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
    <div className="spatial-workspace" data-tree-collapsed={treeCollapsed ? 'true' : 'false'} style={style}>
      {!treeCollapsed && (
        <nav className="spatial-workspace__tree" aria-label="Workspace explorer">
          {tree ?? <p className="panel-empty">Folders, chats, and notes appear here.</p>}
        </nav>
      )}
      {!treeCollapsed && (
        <div
          className="workspace-resize-handle"
          role="separator"
          aria-label="Resize explorer"
          aria-orientation="vertical"
          aria-valuemin={MIN_TREE_WIDTH}
          aria-valuemax={MAX_TREE_WIDTH}
          aria-valuenow={normalizedTreeWidth}
          tabIndex={0}
          onKeyDown={handleSeparatorKey}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
      <main className="spatial-workspace__surface" aria-label="Workspace workbench">
        {surface ?? (
          <section className="workspace-home">
            <strong>Local workspace</strong>
            <p>Open notes, graph views, and saved conversation references here.</p>
          </section>
        )}
      </main>
    </div>
  );
}
