import { FileText, Home, MessageSquareText, Network, Settings, X } from 'lucide-react';

import type { TabKind, WorkspaceTab } from '../../domain/workspace/model';
import { cn } from '../../ui/cn';

interface WorkspaceTabsProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

function TabIcon({ kind }: { kind: TabKind }) {
  const props = { size: 12, strokeWidth: 1.8, 'aria-hidden': true as const };
  if (kind === 'home') return <Home {...props} />;
  if (kind === 'chat') return <MessageSquareText {...props} />;
  if (kind === 'note') return <FileText {...props} />;
  if (kind === 'graph') return <Network {...props} />;
  return <Settings {...props} />;
}

export function WorkspaceTabs({ tabs, activeTabId, onActivate, onClose }: WorkspaceTabsProps) {
  return (
    <div className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto" role="tablist" aria-label="Workspace tabs">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <div
            className={cn(
              'group flex h-9 min-w-0 shrink-0 items-stretch border-r border-white/[0.065] transition-colors',
              active ? 'bg-cs-bg text-cs-text shadow-[inset_0_-1px_0_rgb(255_255_255_/_0.72)]' : 'text-cs-muted hover:bg-white/[0.035]',
            )}
            key={tab.id}
          >
            <button
              className="flex min-w-0 max-w-44 items-center gap-1.5 px-2.5 text-left text-[11px] outline-none focus-visible:bg-white/[0.055]"
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onActivate(tab.id)}
            >
              <span className={active ? 'text-cs-text' : 'text-cs-subtle'}>
                <TabIcon kind={tab.kind} />
              </span>
              <span className="truncate">{tab.title}</span>
            </button>
            {!tab.pinned && (
              <button
                className="grid w-7 place-items-center text-cs-subtle opacity-0 outline-none transition group-hover:opacity-100 hover:bg-white/[0.055] hover:text-cs-text focus-visible:opacity-100"
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={() => onClose(tab.id)}
              >
                <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
