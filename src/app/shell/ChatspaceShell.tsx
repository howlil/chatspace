import { PanelLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface ChatspaceShellProps {
  children?: ReactNode;
}

export function ChatspaceShell({ children }: ChatspaceShellProps) {
  return (
    <section
      className="grid h-full w-full grid-rows-[40px_minmax(0,1fr)] overflow-hidden bg-cs-bg text-cs-text"
      aria-label="Chatspace workspace"
    >
      <header className="flex min-w-0 items-center gap-2 border-b border-white/[0.075] bg-cs-panel px-2.5">
        <div className="grid size-6 shrink-0 place-items-center rounded-md border border-white/[0.09] bg-white/[0.04] text-cs-muted">
          <PanelLeft size={13} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="grid min-w-0 gap-0.5 leading-none">
          <strong className="truncate text-[11px] font-semibold tracking-[-0.01em]">Chatspace</strong>
          <span className="truncate text-[9px] text-cs-subtle">Workspace beside ChatGPT</span>
        </div>
      </header>
      <div className="min-h-0 overflow-hidden">{children ?? <p className="p-3 text-cs-muted">Workspace ready</p>}</div>
    </section>
  );
}
