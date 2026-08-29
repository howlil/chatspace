import { Moon, PanelLeft, Sun } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { IconButton } from '../../ui/primitives';

interface ChatspaceShellProps {
  children?: ReactNode;
  headerActions?: ReactNode;
}

type ThemeMode = 'light' | 'dark';
const THEME_KEY = 'chatspace-theme';

function initialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ChatspaceShell({ children, headerActions }: ChatspaceShellProps) {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';

  return (
    <section
      className="grid h-full w-full grid-rows-[40px_minmax(0,1fr)] overflow-hidden bg-cs-bg text-cs-text"
      aria-label="Chatspace workspace"
    >
      <header className="flex min-w-0 items-center gap-2 border-b border-cs-border bg-cs-panel px-2.5">
        <div className="grid size-6 shrink-0 place-items-center rounded-md border border-cs-border bg-cs-control text-cs-muted">
          <PanelLeft size={13} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="grid min-w-0 flex-1 gap-0.5 leading-none">
          <strong className="truncate text-[11px] font-semibold tracking-[-0.01em]">Chatspace</strong>
          <span className="truncate text-[9px] text-cs-subtle">Workspace beside ChatGPT</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {headerActions}
          <IconButton
            className="size-7 text-cs-subtle"
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
            onClick={() => setTheme(nextTheme)}
          >
            {theme === 'dark' ? <Sun size={12} aria-hidden="true" /> : <Moon size={12} aria-hidden="true" />}
          </IconButton>
        </div>
      </header>
      <div className="min-h-0 overflow-hidden">{children ?? <p className="p-3 text-cs-muted">Workspace ready</p>}</div>
    </section>
  );
}
