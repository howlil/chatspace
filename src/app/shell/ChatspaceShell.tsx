import type { ReactNode } from 'react';

interface ChatspaceShellProps {
  children?: ReactNode;
}

export function ChatspaceShell({ children }: ChatspaceShellProps) {
  return (
    <section className="chatspace-shell" aria-label="Chatspace workspace">
      <header className="chatspace-shell__header">
        <div className="chatspace-brand-mark" aria-hidden="true">C</div>
        <div className="chatspace-brand-copy">
          <strong>Chatspace</strong>
          <span>Workspace beside ChatGPT</span>
        </div>
      </header>
      <div className="chatspace-shell__body">{children ?? <p>Workspace ready</p>}</div>
    </section>
  );
}
