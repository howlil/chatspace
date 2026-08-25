import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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
  onActivateTab,
  onCloseTab,
}: WorkbenchChromeProps) {
  return (
    <div className="flex h-9 min-w-0 items-stretch border-b border-white/[0.065] bg-cs-panel">
      <div className="grid w-9 shrink-0 place-items-center border-r border-white/[0.065]">
        <IconButton className="size-7 text-cs-subtle" aria-label="Toggle explorer" onClick={onToggleExplorer}>
          {explorerCollapsed ? <PanelLeftOpen size={13} aria-hidden="true" /> : <PanelLeftClose size={13} aria-hidden="true" />}
        </IconButton>
      </div>
      <WorkspaceTabs tabs={tabs} activeTabId={activeTabId} onActivate={onActivateTab} onClose={onCloseTab} />
      <div
        className="flex shrink-0 items-center gap-1.5 border-l border-white/[0.065] px-2.5 text-[9px] text-cs-subtle"
        title="Native ChatGPT stays in the main browser page"
      >
        <span
          className={providerSupported ? 'size-1.5 rounded-full bg-emerald-300/75' : 'size-1.5 rounded-full bg-zinc-600'}
          aria-hidden="true"
        />
        <span className="hidden max-w-28 truncate min-[560px]:inline">{providerLabel}</span>
      </div>
    </div>
  );
}
