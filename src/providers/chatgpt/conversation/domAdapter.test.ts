import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatGptDomAdapter } from './domAdapter';

describe('ChatGptDomAdapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('uses semantic message attributes and stable source ids', () => {
    document.body.innerHTML = `
      <main>
        <article data-message-id="u1"><div data-message-author-role="user">Database schema</div></article>
        <article data-message-id="a1"><div data-message-author-role="assistant">Use PostgreSQL</div></article>
      </main>`;
    const adapter = new ChatGptDomAdapter(() => 'https://chatgpt.com/c/abc');
    const snapshot = adapter.readConversation();
    expect(snapshot?.messages).toHaveLength(2);
    expect(snapshot?.messages[0]?.source.sourceId).toBe('u1');
    expect(snapshot?.diagnostics.selectorStrategy).toBe('semantic');
  });

  it('returns an explicit unsupported state instead of pretending there are zero messages', () => {
    document.body.innerHTML = '<main><p>Loading...</p></main>';
    const snapshot = new ChatGptDomAdapter(() => 'https://chatgpt.com/c/abc').readConversation();
    expect(snapshot?.availability).toBe('dom-unsupported');
    expect(snapshot?.messages).toEqual([]);
  });

  it('reveals a source without replacing or cloning provider content', () => {
    document.body.innerHTML = '<div data-message-id="u1"><div data-message-author-role="user">Jump me</div></div>';
    const element = document.querySelector<HTMLElement>('[data-message-author-role]');
    expect(element).not.toBeNull();
    if (element !== null) vi.spyOn(element, 'scrollIntoView').mockImplementation(() => undefined);
    const adapter = new ChatGptDomAdapter(() => 'https://chatgpt.com/c/abc');
    adapter.readConversation();
    expect(adapter.revealMessage('u1')).toBe(true);
    expect(element?.textContent).toBe('Jump me');
  });
});
