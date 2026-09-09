import { afterEach, describe, expect, it } from 'vitest';

import { mountChatGptTurnCards, refreshChatGptTurnCards } from './turnCards';

function main(): HTMLElement {
  let element = document.querySelector<HTMLElement>('main');
  if (element !== null) return element;
  element = document.createElement('main');
  document.body.append(element);
  return element;
}

function renderMessage(role: 'user' | 'assistant', text: string, suffix: string): HTMLElement {
  const turn = document.createElement('article');
  turn.dataset.testid = `conversation-turn-${suffix}`;
  const message = document.createElement('div');
  message.setAttribute('data-message-author-role', role);
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
    expect(node).not.toBeNull();
    expect(node?.textContent).toContain('Question');
    expect(node?.textContent).toContain('Answer with code and text');
  });

  it('updates the same node while an assistant response streams', () => {
    const pair = renderPair('Explain queues', 'A queue', '1');
    const responseTurn = pair.response.closest<HTMLElement>('article');
    responseTurn?.setAttribute('aria-busy', 'true');

    const controller = mountChatGptTurnCards({
      doc: document,
      getHref: () => 'https://chatgpt.com/c/streaming-chat',
    });

    expect(document.querySelectorAll('[data-chatspace-node-id]')).toHaveLength(1);
    expect(document.querySelector('[data-chatspace-node-id]')?.getAttribute('data-chatspace-streaming')).toBe('true');

    pair.response.textContent = 'A queue preserves ordering while work waits.';
    controller.refresh();
    expect(document.querySelectorAll('[data-chatspace-node-id]')).toHaveLength(1);
    expect(document.querySelector('[data-chatspace-response]')?.textContent).toContain('preserves ordering');

    responseTurn?.setAttribute('aria-busy', 'false');
    controller.refresh();
    expect(document.querySelectorAll('[data-chatspace-node-id]')).toHaveLength(1);
    expect(document.querySelector('[data-chatspace-node-id]')?.getAttribute('data-chatspace-streaming')).toBe('false');
    controller.disconnect();
  });

  it('keeps the old path and creates a sibling branch when a forked conversation shares the same prefix', () => {
    let href = 'https://chatgpt.com/c/original-chat';
    renderPair('Root prompt', 'Root answer', '1');
    renderPair('Original follow-up', 'Original answer', '2');

    const controller = mountChatGptTurnCards({
      doc: document,
      getHref: () => href,
    });
    expect(document.querySelectorAll('[data-chatspace-node-id]')).toHaveLength(2);

    main().innerHTML = '';
    href = 'https://chatgpt.com/c/forked-chat';
    renderPair('Root prompt', 'Root answer', '1-fork');
    renderPair('Forked follow-up', 'Forked answer', '2-fork');
    controller.refresh();

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-chatspace-node-id]'));
    const children = nodes.filter((node) => node.getAttribute('data-chatspace-depth') === '1');
    expect(nodes).toHaveLength(3);
    expect(children).toHaveLength(2);
    expect(new Set(children.map((node) => node.getAttribute('data-chatspace-lane'))).size).toBe(2);
    expect(document.querySelectorAll('[data-chatspace-edge]')).toHaveLength(2);
    expect(document.getElementById('chatspace-conversation-canvas')?.textContent).toContain('Original follow-up');
    expect(document.getElementById('chatspace-conversation-canvas')?.textContent).toContain('Forked follow-up');
    controller.disconnect();
  });

  it('surfaces a fork action when ChatGPT exposes a native branch control', () => {
    const pair = renderPair('Question', 'Answer', '1');
    const nativeFork = document.createElement('button');
    nativeFork.setAttribute('aria-label', 'Branch in new chat');
    pair.response.closest('article')?.append(nativeFork);

    const controller = mountChatGptTurnCards({
      doc: document,
      getHref: () => 'https://chatgpt.com/c/branchable-chat',
    });

    expect(document.querySelector<HTMLButtonElement>('[data-chatspace-fork]')?.textContent).toBe('Fork');
    controller.disconnect();
  });

  it('can mount while the document body is not available yet', () => {
    const earlyDocument = document.implementation.createHTMLDocument('early');
    earlyDocument.body.remove();

    const controller = mountChatGptTurnCards({
      doc: earlyDocument,
      getHref: () => 'https://chatgpt.com/c/early-chat',
    });

    expect(earlyDocument.body).toBeNull();
    expect(earlyDocument.getElementById('chatspace-turn-card-styles')).not.toBeNull();
    controller.disconnect();
    expect(earlyDocument.getElementById('chatspace-turn-card-styles')).toBeNull();
  });
});
