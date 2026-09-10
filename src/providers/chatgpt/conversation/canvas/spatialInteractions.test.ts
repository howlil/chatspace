import { afterEach, describe, expect, it } from 'vitest';

import { mountChatGptTurnCards } from '../turnCards';

function main(): HTMLElement {
  let element = document.querySelector<HTMLElement>('main');
  if (element !== null) return element;
  element = document.createElement('main');
  document.body.append(element);
  return element;
}

function renderPair(prompt: string, response: string, suffix: string): void {
  const renderMessage = (role: 'user' | 'assistant', text: string, id: string) => {
    const turn = document.createElement('article');
    turn.dataset.testid = `conversation-turn-${id}`;
    const message = document.createElement('div');
    message.setAttribute('data-message-author-role', role);
    message.setAttribute('data-message-id', `${role}-${id}`);
    message.textContent = text;
    turn.append(message);
    main().append(turn);
  };
  renderMessage('user', prompt, `${suffix}-user`);
  renderMessage('assistant', response, `${suffix}-assistant`);
}

function drag(element: HTMLElement, dx: number, dy: number): void {
  const viewport = element.closest('[data-chatspace-viewport]');
  element.dispatchEvent(new MouseEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: 100,
    clientY: 100,
  }));
  viewport?.dispatchEvent(new MouseEvent('pointermove', {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: 100 + dx,
    clientY: 100 + dy,
  }));
  viewport?.dispatchEvent(new MouseEvent('pointerup', {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: 100 + dx,
    clientY: 100 + dy,
  }));
}

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-chatspace-canvas-active');
});

describe('spatial canvas interactions', () => {
  it('locks document scrolling only while the canvas is mounted', () => {
    renderPair('Question', 'Answer', 'scroll');
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => 'https://chatgpt.com/c/scroll-lock' });

    expect(document.documentElement.getAttribute('data-chatspace-canvas-active')).toBe('true');

    controller.disconnect();
    expect(document.documentElement.hasAttribute('data-chatspace-canvas-active')).toBe(false);
  });

  it('keeps a manually moved card stable when topology grows and lets Arrange restore layout', () => {
    renderPair('Root', 'Root answer', 'root');
    const controller = mountChatGptTurnCards({ doc: document, getHref: () => 'https://chatgpt.com/c/spatial' });
    const root = document.querySelector<HTMLElement>('[data-chatspace-node-id]');
    expect(root).not.toBeNull();
    if (root === null) return;

    const initialLeft = root.style.left;
    const initialTop = root.style.top;
    drag(root, 120, 80);
    const movedLeft = root.style.left;
    const movedTop = root.style.top;
    expect(movedLeft).not.toBe(initialLeft);
    expect(movedTop).not.toBe(initialTop);

    renderPair('Child', 'Child answer', 'child');
    controller.refresh();
    expect(root.style.left).toBe(movedLeft);
    expect(root.style.top).toBe(movedTop);

    const arrange = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-chatspace-toolbar-button]'))
      .find((button) => button.textContent === 'Arrange');
    arrange?.click();
    expect(root.style.left).toBe(initialLeft);
    expect(root.style.top).toBe(initialTop);

    controller.disconnect();
  });
});
