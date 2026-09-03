import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';

import { WorkspaceApp, type WorkspaceView } from '../../src/app/WorkspaceApp';
import { ChatspaceShell } from '../../src/app/shell/ChatspaceShell';
import { WorkspaceErrorBoundary } from '../../src/app/shell/WorkspaceErrorBoundary';
import { BrowserLocalVault } from '../../src/integrations/local-vault/BrowserLocalVault';
import { createDefaultWorkspaceRepository } from '../../src/persistence/chromeStorageWorkspaceRepository';
import { normalizeChatGptTarget } from '../../src/providers/chatgpt/adapter';
import {
  navigateActiveProvider,
  readActiveProviderState,
  type ProviderTabsPort,
  type ProviderTabState,
} from '../../src/providers/chatgpt/browserTabProvider';
import '../../src/styles/tailwind.css';
import { Button } from '../../src/ui/primitives';

const workspaceRepository = createDefaultWorkspaceRepository();
const localVault = new BrowserLocalVault();

const providerTabsPort: ProviderTabsPort = {
  async getActive() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab === undefined) return undefined;
    return { id: tab.id, url: tab.url, title: tab.title, windowId: tab.windowId };
  },
  async findByTarget(target) {
    const tabs = await browser.tabs.query({});
    const match = tabs.find((tab) => tab.url !== undefined && normalizeChatGptTarget(tab.url) === target);
    if (match === undefined) return undefined;
    return { id: match.id, url: match.url, title: match.title, windowId: match.windowId };
  },
  async focus(tab) {
    if (tab.id !== undefined) await browser.tabs.update(tab.id, { active: true });
    if (tab.windowId !== undefined) await browser.windows.update(tab.windowId, { focused: true });
  },
  async update(tabId, url) {
    await browser.tabs.update(tabId, { url });
  },
  async create(url) {
    await browser.tabs.create({ url });
  },
};

function stateUrl(state: ProviderTabState): string {
  return state.url ?? 'about:blank';
}

function SidepanelWorkspace({
  view,
  onBackToWorkspace,
  onOpenMarkdownSync,
}: {
  view: WorkspaceView;
  onBackToWorkspace: () => void;
  onOpenMarkdownSync: () => void;
}) {
  const [providerState, setProviderState] = useState<ProviderTabState>({
    kind: 'unavailable',
    url: null,
    title: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const refreshProvider = useCallback(async () => {
    setRefreshing(true);
    try {
      setProviderState(await readActiveProviderState(providerTabsPort));
    } catch {
      setProviderState({ kind: 'unavailable', url: null, title: null });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshProvider();

    const onActivated = () => void refreshProvider();
    const onUpdated = () => void refreshProvider();
    const onFocus = () => void refreshProvider();
    const interval = window.setInterval(() => void refreshProvider(), 1500);

    browser.tabs.onActivated.addListener(onActivated);
    browser.tabs.onUpdated.addListener(onUpdated);
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(interval);
      browser.tabs.onActivated.removeListener(onActivated);
      browser.tabs.onUpdated.removeListener(onUpdated);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshProvider]);

  const providerUrl = useMemo(() => stateUrl(providerState), [providerState]);

  return (
    <div className="h-full min-h-0 w-full">
      {providerState.kind === 'unavailable' && view === 'workspace' && (
        <div
          className="flex min-w-0 items-center justify-between gap-3 border-b border-amber-200/10 bg-amber-200/[0.045] px-2.5 py-2"
          role="status"
        >
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-[11px] font-medium text-cs-text">ChatGPT tab not connected</strong>
            <span className="truncate text-[10px] text-cs-muted">Open ChatGPT in the active tab, then reconnect.</span>
          </div>
          <Button onClick={() => void refreshProvider()} disabled={refreshing}>
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={12} aria-hidden="true" />
            {refreshing ? 'Checking' : 'Reconnect'}
          </Button>
        </div>
      )}
      <WorkspaceApp
        view={view}
        onBackToWorkspace={onBackToWorkspace}
        onOpenMarkdownSync={onOpenMarkdownSync}
        repository={workspaceRepository}
        localVault={localVault}
        currentUrl={() => providerUrl}
        currentTitle={() => providerState.title}
        navigate={(target) => {
          void navigateActiveProvider(providerTabsPort, target)
            .then(() => refreshProvider())
            .catch(() => refreshProvider());
        }}
      />
    </div>
  );
}

function SidepanelApp() {
  const [view, setView] = useState<WorkspaceView>('workspace');

  return (
    <ChatspaceShell>
      <SidepanelWorkspace
        view={view}
        onBackToWorkspace={() => setView('workspace')}
        onOpenMarkdownSync={() => setView('markdown-sync')}
      />
    </ChatspaceShell>
  );
}

const rootElement = document.getElementById('root');
if (rootElement === null) throw new Error('Chatspace side panel root is missing.');

createRoot(rootElement).render(
  <WorkspaceErrorBoundary>
    <SidepanelApp />
  </WorkspaceErrorBoundary>,
);
