import type { ReactNode } from 'react';

interface SpatialWorkspaceProps {
  tree?: ReactNode;
  surface?: ReactNode;
  provider?: ReactNode;
}

export function SpatialWorkspace({ tree, surface, provider }: SpatialWorkspaceProps) {
  return (
    <div className="spatial-workspace">
      <nav className="spatial-workspace__tree" aria-label="Workspace tree">
        <div className="panel-heading">Workspace</div>
        {tree ?? <p className="panel-empty">Folders, chats, and notes appear here.</p>}
      </nav>

      <main className="spatial-workspace__surface" aria-label="Workspace surface">
        <div className="panel-heading">Home</div>
        {surface ?? (
          <section className="workspace-home">
            <strong>Local workspace</strong>
            <p>Open notes, graph views, and saved conversation references without replacing ChatGPT.</p>
          </section>
        )}
      </main>

      <section className="spatial-workspace__provider" aria-label="Provider surface">
        <div className="panel-heading">Provider</div>
        {provider ?? <p className="panel-empty">ChatGPT stays native on the host page.</p>}
      </section>
    </div>
  );
}
