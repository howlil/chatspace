import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';

import { WorkspaceApp } from '../../src/app/WorkspaceApp';
import { ChatspaceShell } from '../../src/app/shell/ChatspaceShell';
import { WorkspaceErrorBoundary } from '../../src/app/shell/WorkspaceErrorBoundary';
import '../../src/app/shell/bootstrap-shell.css';
import {
  navigateActiveProvider,
  readActiveProviderState,
  type ProviderTabsPort,
  type ProviderTabState,
} from '../../src/providers/chatgpt/browserTabProvider';
import './style.css';

const providerTabsPort: ProviderTabsPort = {
  async getActive() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab === undefined) return undefined;
    return { id: tab.id, url: tab.url };
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

function SidepanelWorkspace() {
  const [providerState, setProviderState] = useState<ProviderTabState>({
    kind: 'unavailable',
    url: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const refreshProvider = useCallback(async () => {
    setRefreshing(true);
    try {
      setProviderState(await readActiveProviderState(providerTabsPort));
    } catch {
      setProviderState({ kind: 'unavailable', url: null });
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
    <div className="sidepanel-workspace">
      {providerState.kind === 'unavailable' && (
        <div className="provider-reconnect" role="status">
          <div>
            <strong>ChatGPT tab not connected</strong>
            <span>Open ChatGPT in the active tab, then reconnect.</span>
          </div>
          <button type="button" onClick={() => void refreshProvider()} disabled={refreshing}>
            {refreshing ? 'Checking…' : 'Reconnect'}
          </button>
        </div>
      )}
      <WorkspaceApp
        currentUrl={() => providerUrl}
        navigate={(target) => {
          void navigateActiveProvider(providerTabsPort, target)
            .then(() => refreshProvider())
            .catch(() => refreshProvider());
        }}
      />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement === null) throw new Error('Chatspace side panel root is missing.');

createRoot(rootElement).render(
  <WorkspaceErrorBoundary>
    <ChatspaceShell>
      <SidepanelWorkspace />
    </ChatspaceShell>
  </WorkspaceErrorBoundary>,
);
