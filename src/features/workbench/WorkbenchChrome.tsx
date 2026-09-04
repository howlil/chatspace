import { Home, MoreHorizontal, PanelLeftOpen, Settings } from 'lucide-react';

import type { WorkspaceTab } from '../../domain/workspace/model';
import { IconButton } from '../../ui/primitives';
import { WorkspaceTabs } from '../tabs/WorkspaceTabs';

interface WorkbenchChromeProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  explorerCollapsed: boolean;
  providerSupported: boolean;
  providerLabel: string;
  onToggleExplorer: () => void;
  onOpenHome: () => void;
  onOpenSettings: () => void;
  onOpenMore: () => void;
  onActivateTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export function WorkbenchChrome({
  tabs,
  activeTabId,
  explorerCollapsed,
  providerSupported,
  providerLabel,
  onToggleExplorer,
  onOpenHome,
  onOpenSettings,
  onOpenMore,
  onActivateTab,
  onCloseTab,
}: WorkbenchChromeProps) {
  return (
    <div className="flex h-9 min-w-0 items-stretch border-b border-cs-border bg-cs-panel">
      <nav className="flex shrink-0 items-center gap-0.5 border-r border-cs-border px-1" aria-label="Primary navigation">
        {explorerCollapsed && (
          <IconButton
            className="size-7 text-cs-subtle"
            aria-label="Open library"
            title="Open library"
            onClick={onToggleExplorer}
          >
            <PanelLeftOpen size={13} aria-hidden="true" />
          </IconButton>
        )}
        <IconButton className="size-7 text-cs-subtle" aria-label="Home" title="Home" onClick={onOpenHome}>
          <Home size={12} aria-hidden="true" />
        </IconButton>
      </nav>
      <WorkspaceTabs tabs={tabs} activeTabId={activeTabId} onActivate={onActivateTab} onClose={onCloseTab} />
      <nav className="flex shrink-0 items-center gap-0.5 border-l border-cs-border px-1" aria-label="Workspace utilities">
        <IconButton className="size-7 text-cs-subtle" aria-label="Settings" title="Settings" onClick={onOpenSettings}>
          <Settings size={12} aria-hidden="true" />
        </IconButton>
        <IconButton className="size-7 text-cs-subtle" aria-label="More" title="More · Graph" onClick={onOpenMore}>
          <MoreHorizontal size={12} aria-hidden="true" />
        </IconButton>
      </nav>
      <div
        className="flex shrink-0 items-center gap-1.5 border-l border-cs-border px-2.5 text-[9px] text-cs-subtle"
        title="Native ChatGPT stays in the main browser page"
      >
        <span
          className={providerSupported ? 'size-1.5 rounded-full bg-emerald-500/75' : 'size-1.5 rounded-full bg-cs-subtle'}
          aria-hidden="true"
        />
        <span className="hidden max-w-28 truncate min-[700px]:inline">{providerLabel}</span>
      </div>
    </div>
  );
}
