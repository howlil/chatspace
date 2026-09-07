import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';

import { ConversationController, type ConversationControllerPort, type ConversationControllerState } from '../../src/app/conversation/ConversationController';
import { ChatspaceShell } from '../../src/app/shell/ChatspaceShell';
import { ErrorBoundary } from '../../src/app/shell/ErrorBoundary';
import { getChatGptCapability } from '../../src/providers/chatgpt/adapter';
import { CHATGPT_CONTENT_SCRIPT_PATH, type ChatGptBridgeRequest } from '../../src/providers/chatgpt/conversation/bridge';
import '../../src/styles/tailwind.css';
import type { ConversationAnnotation } from '../../src/domain/conversation/model';
import { projectConversationGraph } from '../../src/domain/conversation/projection';
import { loadConversationAnnotations, saveConversationAnnotation } from '../../src/persistence/conversationAnnotationStore';
import { Button } from '../../src/ui/primitives';
import { ConversationGraph } from '../../src/features/conversation-graph/ConversationGraph';

const annotationStorage = browser.storage.local;

function ConversationMapApp() {
  const conversationPort = useMemo<ConversationControllerPort>(() => ({
    getActiveTab: async () => {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      return tab === undefined ? undefined : { id: tab.id, url: tab.url, title: tab.title };
    },
    sendMessage: (tabId, message: ChatGptBridgeRequest) => browser.tabs.sendMessage(tabId, message),
    ensureContentScript: async (tabId) => {
      await browser.scripting.executeScript({
        target: { tabId },
        files: [CHATGPT_CONTENT_SCRIPT_PATH],
      });
    },
    subscribe: (listener) => {
      const onMessage = (message: unknown, sender: { tab?: { id?: number | undefined } | undefined }) => listener(message, sender.tab?.id);
      browser.runtime.onMessage.addListener(onMessage);
      return () => browser.runtime.onMessage.removeListener(onMessage);
    },
  }), []);
  const conversationController = useMemo(() => new ConversationController(conversationPort), [conversationPort]);
  const [conversationState, setConversationState] = useState<ConversationControllerState>(conversationController.getState());
  const [annotations, setAnnotations] = useState<ConversationAnnotation[]>([]);

  useEffect(() => {
    const stopConversation = conversationController.subscribe(setConversationState);
    const stopRuntime = conversationController.start();

    const onActivated = () => void conversationController.refresh();
    const onUpdated = (_tabId: number, changeInfo: { status?: string }) => {
      if (changeInfo.status === 'complete') void conversationController.refresh();
    };

    browser.tabs.onActivated.addListener(onActivated);
    browser.tabs.onUpdated.addListener(onUpdated);

    return () => {
      stopConversation();
      stopRuntime();
      browser.tabs.onActivated.removeListener(onActivated);
      browser.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [conversationController]);

  useEffect(() => {
    const target = conversationState.snapshot?.target;
    if (target === undefined) {
      setAnnotations([]);
      return;
    }
    let cancelled = false;
    void loadConversationAnnotations(annotationStorage, target).then((next) => {
      if (!cancelled) setAnnotations(next);
    });
    return () => { cancelled = true; };
  }, [conversationState.snapshot?.target]);

  const liveSnapshot = conversationState.snapshot;

  const updateAnnotation = useCallback((sourceKey: string, patch: { note?: string; pinned?: boolean }) => {
    if (liveSnapshot === null) return;
    const current = annotations.find((item) => item.sourceKey === sourceKey);
    const now = Date.now();
    const next: ConversationAnnotation = {
      id: current?.id ?? `annotation:${liveSnapshot.target}:${sourceKey}`,
      conversationTarget: liveSnapshot.target,
      sourceKey,
      note: patch.note ?? current?.note ?? '',
      pinned: patch.pinned ?? current?.pinned ?? false,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    setAnnotations((items) => [...items.filter((item) => item.id !== next.id), ...(next.note.trim() !== '' || next.pinned ? [next] : [])]);
    void saveConversationAnnotation(annotationStorage, next);
  }, [annotations, liveSnapshot]);

  if (liveSnapshot !== null && conversationState.phase === 'available') {
    const graph = projectConversationGraph(liveSnapshot);
    return (
      <div className="h-full min-h-0 w-full">
        <ConversationGraph
          snapshot={liveSnapshot}
          graph={graph}
          annotations={annotations}
          activeSourceId={conversationState.visibleSourceId}
          onGoToSource={(sourceId) => { void conversationController.revealSource(sourceId); }}
          onUpdateAnnotation={updateAnnotation}
        />
      </div>
    );
  }

  const activeCapability = getChatGptCapability(conversationState.tab?.url ?? '');
  if (activeCapability.canCaptureCurrentReference && (conversationState.phase === 'loading' || conversationState.phase === 'unsupported')) {
    return (
      <div className="grid h-full place-items-center overflow-y-auto p-6">
        <div className="grid max-w-xs gap-2 text-center">
          <strong className="text-sm font-medium">{conversationState.phase === 'loading' ? 'Reading conversation…' : 'Conversation map unavailable'}</strong>
          <span className="text-[11px] leading-5 text-cs-muted">{conversationState.phase === 'loading' ? 'Chatspace is reading the rendered ChatGPT conversation in this tab.' : conversationState.error ?? 'Conversation structure changed. Reload the ChatGPT tab and try again.'}</span>
          {conversationState.phase === 'unsupported' && <Button onClick={() => void conversationController.refresh()}>Retry reading</Button>}
          <span className="text-[9px] text-cs-subtle">Content stays ephemeral; only pins and annotations are saved.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full place-items-center overflow-y-auto p-6">
      <div className="grid max-w-xs gap-2 text-center">
        <strong className="text-sm font-medium">Open a ChatGPT conversation</strong>
        <span className="text-[11px] leading-5 text-cs-muted">Chatspace maps the rendered conversation beside ChatGPT. Conversation text stays ephemeral.</span>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement === null) throw new Error('Chatspace side panel root is missing.');

createRoot(rootElement).render(
  <ErrorBoundary>
    <ChatspaceShell>
      <ConversationMapApp />
    </ChatspaceShell>
  </ErrorBoundary>,
);
