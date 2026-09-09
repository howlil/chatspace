import { afterEach, describe, expect, it } from 'vitest';

import { mountChatGptTurnCards, refreshChatGptTurnCards } from './turnCards';

function renderTurn(role: 'user' | 'assistant', text: string, suffix: string): HTMLElement {
  const turn = document.createElement('article');
  turn.dataset.testid = `conversation-turn-${suffix}`;
  const message = document.createElement('div');
  message.setAttribute('data-message-author-role', role);
  message.textContent = text;
  turn.append(message);
  document.body.append(turn);
  return message;
}

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

describe('ChatGPT main-pane turn cards', () => {
  it('decorates assistant responses without rewriting provider content', () => {
    const user = renderTurn('user', 'Question', '1');
    const response = renderTurn('assistant', 'Answer with code and text', '2');
    const before = response.innerHTML;

    const cards = refreshChatGptTurnCards(document);

    expect(cards).toEqual([response]);
    expect(response.getAttribute('data-chatspace-card')).toBe('response');
    expect(response.innerHTML).toBe(before);
    expect(user.hasAttribute('data-chatspace-card')).toBe(false);
  });

  it('marks visible response variants as a card state without inventing hidden branches', () => {
    const response = renderTurn('assistant', 'Alternative answer', '2');
    const turn = response.closest('article');
    const next = document.createElement('button');
    next.setAttribute('aria-label', 'Next response');
    turn?.append(next);

    refreshChatGptTurnCards(document);

    expect(response.getAttribute('data-chatspace-has-variants')).toBe('true');
  });

  it('decorates responses that appear after mount, including responses rendered after a fork navigation', () => {
    const controller = mountChatGptTurnCards({
      doc: document,
      getHref: () => 'https://chatgpt.com/c/forked-chat',
    });
    const response = renderTurn('assistant', 'Forked conversation response', '9');

    controller.refresh();

    expect(response.getAttribute('data-chatspace-card')).toBe('response');
    expect(document.getElementById('chatspace-turn-card-styles')).not.toBeNull();
    controller.disconnect();
    expect(response.hasAttribute('data-chatspace-card')).toBe(false);
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
