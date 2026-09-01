import { FileText, Home, MessageSquareText, Network, Settings, X } from 'lucide-react';
import { Tabs } from 'radix-ui';

import type { TabKind, WorkspaceTab } from '../../domain/workspace/model';
import { cn } from '../../ui/cn';
import { IconButton } from '../../ui/primitives';

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
    <Tabs.Root
      value={activeTabId}
      onValueChange={onActivate}
      className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto"
    >
      <Tabs.List aria-label="Workspace tabs" className="flex min-w-0 flex-1">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <div
              className={cn(
                'group flex h-9 min-w-0 shrink-0 items-stretch border-r border-cs-border transition-colors',
                active ? 'bg-cs-bg text-cs-text shadow-[inset_0_-1px_0_var(--color-cs-focus)]' : 'text-cs-muted hover:bg-cs-hover',
              )}
              key={tab.id}
            >
              <Tabs.Trigger
                value={tab.id}
                className="flex min-w-0 max-w-44 items-center gap-1.5 px-2.5 text-left text-[11px] outline-none focus-visible:bg-cs-hover"
              >
                <span className={active ? 'text-cs-text' : 'text-cs-subtle'}>
                  <TabIcon kind={tab.kind} />
                </span>
                <span className="truncate">{tab.title}</span>
              </Tabs.Trigger>
              {!tab.pinned && (
                <IconButton
                  className="h-9 w-7 rounded-none text-cs-subtle opacity-0 transition group-hover:opacity-100 hover:bg-cs-hover hover:text-cs-text focus-visible:opacity-100"
                  aria-label={`Close ${tab.title}`}
                  onClick={() => onClose(tab.id)}
                >
                  <X size={12} strokeWidth={1.8} aria-hidden="true" />
                </IconButton>
              )}
            </div>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}
