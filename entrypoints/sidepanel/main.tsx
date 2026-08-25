import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';

import { WorkspaceApp } from '../../src/app/WorkspaceApp';
import { ChatspaceShell } from '../../src/app/shell/ChatspaceShell';
import { WorkspaceErrorBoundary } from '../../src/app/shell/WorkspaceErrorBoundary';
import '../../src/app/shell/bootstrap-shell.css';
import './style.css';

interface ProviderLocationResponse {
  href?: string;
}

async function activeProviderTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function readProviderUrl(): Promise<string> {
  const tab = await activeProviderTab();
  if (tab?.id === undefined) return 'about:blank';

  try {
    const response = (await browser.tabs.sendMessage(tab.id, {
      type: 'chatspace/provider/location',
    })) as ProviderLocationResponse | undefined;
    return response?.href ?? tab.url ?? 'about:blank';
  } catch {
    return tab.url ?? 'about:blank';
  }
}

async function navigateProvider(target: string): Promise<void> {
  const tab = await activeProviderTab();
  if (tab?.id === undefined) throw new Error('No active browser tab is available.');

  const response = (await browser.tabs.sendMessage(tab.id, {
    type: 'chatspace/provider/navigate',
    target,
  })) as { ok?: boolean; error?: string } | undefined;

  if (response?.ok !== true) {
    throw new Error(response?.error ?? 'ChatGPT navigation is unavailable on the active tab.');
  }
}

function SidepanelWorkspace() {
  const [providerUrl, setProviderUrl] = useState('about:blank');

  const refreshProviderUrl = useCallback(() => {
    void readProviderUrl().then(setProviderUrl).catch(() => setProviderUrl('about:blank'));
  }, []);

  useEffect(() => {
    refreshProviderUrl();
    const onActivated = () => refreshProviderUrl();
    const onUpdated = () => refreshProviderUrl();
    const onFocus = () => refreshProviderUrl();

    browser.tabs.onActivated.addListener(onActivated);
    browser.tabs.onUpdated.addListener(onUpdated);
    window.addEventListener('focus', onFocus);

    return () => {
      browser.tabs.onActivated.removeListener(onActivated);
      browser.tabs.onUpdated.removeListener(onUpdated);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshProviderUrl]);

  return (
    <WorkspaceApp
      currentUrl={() => providerUrl}
      navigate={(target) => {
        void navigateProvider(target)
          .then(() => setProviderUrl(target))
          .catch(() => refreshProviderUrl());
      }}
    />
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
