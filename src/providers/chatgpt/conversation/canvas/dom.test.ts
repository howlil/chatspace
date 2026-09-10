import { describe, expect, it } from 'vitest';

import { collectTurnSnapshots, safeInnerHtml } from './dom';

function addTurn(parent: HTMLElement, role: 'user' | 'assistant', text: string, id: string): HTMLElement {
  const turn = document.createElement('article');
  turn.dataset.testid = `conversation-turn-${id}`;
  const message = document.createElement('div');
  message.setAttribute('data-message-author-role', role);
  message.setAttribute('data-message-id', id);
  message.textContent = text;
  turn.append(message);
  parent.append(turn);
  return message;
}

describe('ChatGPT canvas DOM adapter', () => {
  it('scopes a document scan to the active main conversation region', () => {
    document.body.innerHTML = '';
    const outside = document.createElement('div');
    outside.setAttribute('data-message-author-role', 'assistant');
    outside.textContent = 'Outside preview';
    document.body.append(outside);
    const main = document.createElement('main');
    document.body.append(main);
    addTurn(main, 'user', 'Question', 'u1');
    addTurn(main, 'assistant', 'Answer', 'a1');

    const snapshots = collectTurnSnapshots(document, document);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.promptText).toBe('Question');
    expect(snapshots[0]?.responseText).toBe('Answer');
  });

  it('keeps useful rich content while dropping executable and unsafe markup', () => {
    const source = document.createElement('div');
    source.innerHTML = `
      <p onclick="evil()">Hello <strong>world</strong></p>
      <script>alert(1)</script>
      <iframe src="https://evil.example"></iframe>
      <a href="javascript:alert(1)" target="_blank">bad</a>
      <a href="https://example.com" target="_blank">good</a>
      <img src="data:text/html,evil" onerror="evil()" alt="bad image">
      <code class="language-ts" data-message-id="secret">const x = 1</code>
    `;

    const html = safeInnerHtml(source, document);
    const template = document.createElement('template');
    template.innerHTML = html;

    expect(template.content.querySelector('script')).toBeNull();
    expect(template.content.querySelector('iframe')).toBeNull();
    expect(template.content.querySelector('[onclick]')).toBeNull();
    expect(template.content.querySelector('[onerror]')).toBeNull();
    expect(template.content.querySelector('a')?.hasAttribute('href')).toBe(false);
    const links = template.content.querySelectorAll('a');
    expect(links[1]?.getAttribute('href')).toBe('https://example.com');
    expect(links[1]?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(template.content.querySelector('img')?.hasAttribute('src')).toBe(false);
    expect(template.content.querySelector('code')?.textContent).toContain('const x = 1');
    expect(template.content.querySelector('code')?.getAttribute('class')).toBe('language-ts');
    expect(template.content.querySelector('[data-message-id]')).toBeNull();
  });
});
