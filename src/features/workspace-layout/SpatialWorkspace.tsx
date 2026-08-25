export function SpatialWorkspace() {
  return (
    <div className="spatial-workspace">
      <nav className="spatial-workspace__tree" aria-label="Workspace tree">
        <div className="panel-heading">Workspace</div>
        <p className="panel-empty">Folders, chats, and notes appear here.</p>
      </nav>

      <main className="spatial-workspace__surface" aria-label="Workspace surface">
        <div className="panel-heading">Home</div>
        <section className="workspace-home">
          <strong>Local workspace</strong>
          <p>Open notes, graph views, and saved conversation references without replacing ChatGPT.</p>
        </section>
      </main>

      <section className="spatial-workspace__provider" aria-label="Provider surface">
        <div className="panel-heading">Provider</div>
        <p className="panel-empty">ChatGPT stays native on the host page. Chatspace never mirrors provider state.</p>
      </section>
    </div>
  );
}
