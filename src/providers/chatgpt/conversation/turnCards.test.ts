import { afterEach, describe, expect, it } from 'vitest';

import { mountChatGptTurnCards, refreshChatGptTurnCards } from './turnCards';

function main(): HTMLElement {
  let element = document.querySelector<HTMLElement>('main');
  if (element !== null) return element;
  element = document.createElement('main');
  document.body.append(element);
  return element;
}

function renderMessage(role: 'user' | 'assistant', text: string, suffix: string, messageId?: string): HTMLElement {
  const turn = document.createElement('article');
  turn.dataset.testid = `conversation-turn-${suffix}`;
  const message = document.createElement('div');
  message.setAttribute('data-message-author-role', role);
  if (messageId !== undefined) message.setAttribute('data-message-id', messageId);
  message.textContent = text;
  turn.append(message);
  main().append(turn);
  return message;
}

function renderPair(prompt: string, response: string, suffix: string): { prompt: HTMLElement; response: HTMLElement } {
  return {
    prompt: renderMessage('user', prompt, `${suffix}-user`),
    response: renderMessage('assistant', response, `${suffix}-assistant`),
  };
}

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

describe('ChatGPT main-pane conversation canvas', () => {
  it('projects a prompt and response into one compact canvas node without rewriting provider content', () => {
    const pair = renderPair('Question', 'Answer with code and text', '1');
    const before = pair.response.innerHTML;
    const responses = refreshChatGptTurnCards(document);
    expect(responses).toEqual([pair.response]);
    expect(pair.response.innerHTML).toBe(before);
    expect(pair.prompt.closest('article')?.getAttribute('data-chatspace-source-hidden')).toBe('true');
    expect(pair.response.closest('article')?.getAttribute('data-chatspace-source-hidden')).toBe('true');
    const canvas = document.getElementById('chatspace-conversation-canvas');
    const node = canvas?.querySelector<HTMLElement>('[data-chatspace-node-id]');
    expect(canvas).not.toBeNull();
    expect(node?.textContent).toContain('Question');
    expect(node?.textContent).toContain('Answer with code and text');
  });

  it('keeps a pending prompt and completed response in one logical canvas node', () => {
    renderMessage('user', 'Pending question', 'pending-user', 'user-1');
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => 'https://chatgpt.com/c/pending-chat' });
    expect(document.querySelectorAll('[data-chatspace-node-id]')).toHaveLength(1);
    renderMessage('assistant', 'Completed answer', 'pending-assistant', 'assistant-1');
    controller.refresh();
    expect(document.querySelectorAll('[data-chatspace-node-id]')).toHaveLength(1);
    expect(document.querySelector('[data-chatspace-response]')?.textContent).toContain('Completed answer');
    controller.disconnect();
  });

  it('updates the same card DOM while an assistant response streams', () => {
    const pair = renderPair('Explain queues', 'A queue', '1');
    pair.response.setAttribute('data-message-id', 'assistant-stream');
    const responseTurn = pair.response.closest<HTMLElement>('article');
    responseTurn?.setAttribute('aria-busy', 'true');
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => 'https://chatgpt.com/c/streaming-chat' });
    const cardBefore = document.querySelector<HTMLElement>('[data-chatspace-node-id]');
    pair.response.textContent = 'A queue preserves ordering while work waits.';
    controller.refresh();
    const cardAfter = document.querySelector<HTMLElement>('[data-chatspace-node-id]');
    expect(cardAfter).toBe(cardBefore);
    expect(cardAfter?.querySelector('[data-chatspace-response]')?.textContent).toContain('preserves ordering');
    responseTurn?.setAttribute('aria-busy', 'false');
    controller.refresh();
    expect(document.querySelector('[data-chatspace-node-id]')).toBe(cardBefore);
    expect(document.querySelector('[data-chatspace-node-id]')?.getAttribute('data-chatspace-streaming')).toBe('false');
    controller.disconnect();
  });

  it('uses ChatGPT message identity when final content changes outside streaming state', () => {
    const pair = renderPair('Question', 'First answer', 'stable');
    pair.response.setAttribute('data-message-id', 'assistant-stable-id');
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => 'https://chatgpt.com/c/stable-chat' });
    pair.response.textContent = 'Edited final answer with the same provider identity';
    controller.refresh();
    expect(document.querySelectorAll('[data-chatspace-node-id]')).toHaveLength(1);
    expect(document.querySelector('[data-chatspace-response]')?.textContent).toContain('Edited final answer');
    controller.disconnect();
  });

  it('preserves existing card DOM when topology grows', () => {
    renderPair('Root prompt', 'Root answer', 'root');
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => 'https://chatgpt.com/c/growing-chat' });
    const rootCard = document.querySelector<HTMLElement>('[data-chatspace-node-id]');
    renderPair('Second prompt', 'Second answer', 'second');
    controller.refresh();
    expect(document.querySelectorAll('[data-chatspace-node-id]')).toHaveLength(2);
    expect(document.querySelector<HTMLElement>('[data-chatspace-node-id]')).toBe(rootCard);
    controller.disconnect();
  });

  it('keeps the old path and creates a sibling branch when a forked conversation shares the same rendered prefix', () => {
    let href = 'https://chatgpt.com/c/original-chat';
    renderPair('Root prompt', 'Root answer', '1');
    renderPair('Original follow-up', 'Original answer', '2');
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => href });
    main().innerHTML = '';
    href = 'https://chatgpt.com/c/forked-chat';
    renderPair('Root prompt', 'Root answer', '1-fork');
    renderPair('Forked follow-up', 'Forked answer', '2-fork');
    controller.refresh();
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-chatspace-node-id]'));
    const children = nodes.filter((node) => node.getAttribute('data-chatspace-depth') === '1');
    expect(nodes).toHaveLength(3);
    expect(children).toHaveLength(2);
    expect(new Set(children.map((node) => node.style.top)).size).toBe(2);
    expect(document.querySelectorAll('[data-chatspace-edge]')).toHaveLength(2);
    controller.disconnect();
  });

  it('ignores message-like DOM outside the active main conversation region', () => {
    const stray = document.createElement('div');
    stray.setAttribute('data-message-author-role', 'assistant');
    stray.textContent = 'Sidebar preview';
    document.body.append(stray);
    renderPair('Actual prompt', 'Actual answer', 'actual');
    refreshChatGptTurnCards(document);
    expect(document.querySelectorAll('[data-chatspace-node-id]')).toHaveLength(1);
    expect(document.getElementById('chatspace-conversation-canvas')?.textContent).not.toContain('Sidebar preview');
  });

  it('surfaces a fork action when ChatGPT exposes a native branch control', () => {
    const pair = renderPair('Question', 'Answer', '1');
    const nativeFork = document.createElement('button');
    nativeFork.setAttribute('aria-label', 'Branch in new chat');
    pair.response.closest('article')?.append(nativeFork);
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => 'https://chatgpt.com/c/branchable-chat' });
    expect(document.querySelector<HTMLButtonElement>('[data-chatspace-fork]')?.textContent).toBe('Fork');
    controller.disconnect();
  });

  it('pans with wheel and zooms only with a modifier', () => {
    renderPair('Question', 'Answer', 'viewport');
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => 'https://chatgpt.com/c/viewport-chat' });
    const viewport = document.querySelector<HTMLElement>('[data-chatspace-viewport]');
    const scene = document.querySelector<HTMLElement>('[data-chatspace-scene]');
    const readout = document.querySelector<HTMLElement>('[data-chatspace-zoom-readout]');
    const beforePan = scene?.style.transform;
    viewport?.dispatchEvent(new WheelEvent('wheel', { deltaX: 30, deltaY: 40, cancelable: true }));
    expect(scene?.style.transform).not.toBe(beforePan);
    const beforeZoom = readout?.textContent;
    viewport?.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, ctrlKey: true, clientX: 100, clientY: 100, cancelable: true }));
    expect(readout?.textContent).not.toBe(beforeZoom);
    controller.disconnect();
  });

  it('supports roving keyboard navigation between parent and child cards', () => {
    renderPair('First', 'One', 'kbd-1');
    renderPair('Second', 'Two', 'kbd-2');
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => 'https://chatgpt.com/c/keyboard-chat' });
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-chatspace-node-id]'));
    const leaf = cards[1];
    leaf?.focus();
    leaf?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(cards[0]);
    expect(cards[0]?.getAttribute('data-chatspace-selected')).toBe('true');
    controller.disconnect();
  });

  it('can mount while the document body is not available yet', () => {
    const earlyDocument = document.implementation.createHTMLDocument('early');
    earlyDocument.body.remove();
    const controller = mountChatGptTurnCards({ doc: earlyDocument, getHref: () => 'https://chatgpt.com/c/early-chat' });
    expect(earlyDocument.body).toBeNull();
    expect(earlyDocument.getElementById('chatspace-turn-card-styles')).not.toBeNull();
    controller.disconnect();
    expect(earlyDocument.getElementById('chatspace-turn-card-styles')).toBeNull();
  });
});
