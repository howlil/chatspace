import type { WorkspaceTab } from '../../domain/workspace/model';

interface WorkspaceTabsProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export function WorkspaceTabs({ tabs, activeTabId, onActivate, onClose }: WorkspaceTabsProps) {
  return (
    <div className="workspace-tabs" role="tablist" aria-label="Workspace tabs">
      {tabs.map((tab) => (
        <div className="workspace-tab" data-active={tab.id === activeTabId ? 'true' : 'false'} key={tab.id}>
          <button
            className="workspace-tab__label"
            type="button"
            role="tab"
            aria-selected={tab.id === activeTabId}
            onClick={() => onActivate(tab.id)}
          >
            {tab.title}
          </button>
          {!tab.pinned && (
            <button
              className="workspace-tab__close"
              type="button"
              aria-label={`Close ${tab.title}`}
              onClick={() => onClose(tab.id)}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
