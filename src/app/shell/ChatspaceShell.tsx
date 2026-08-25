import { useState, type ReactNode } from 'react';

interface ChatspaceShellProps {
  children?: ReactNode;
}

export function ChatspaceShell({ children }: ChatspaceShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        className="chatspace-restore"
        type="button"
        aria-label="Open Chatspace"
        onClick={() => setCollapsed(false)}
      >
        Chatspace
      </button>
    );
  }

  return (
    <aside className="chatspace-shell" aria-label="Chatspace workspace">
      <header className="chatspace-shell__header">
        <strong>Chatspace</strong>
        <button type="button" aria-label="Hide Chatspace" onClick={() => setCollapsed(true)}>
          Hide
        </button>
      </header>
      <div className="chatspace-shell__body">{children ?? <p>Workspace ready</p>}</div>
    </aside>
  );
}
