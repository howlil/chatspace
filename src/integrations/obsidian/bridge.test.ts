import { describe, expect, it, vi } from 'vitest';

import { createLocalNote } from '../../domain/workspace/model';
import { HttpLocalVaultBridge, LOCAL_BRIDGE_ORIGIN } from './bridge';

describe('HttpLocalVaultBridge', () => {
  it('sends only explicit note content with bearer authorization', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ path: 'Chatspace/Transactions-note-1.md' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const bridge = new HttpLocalVaultBridge(fetchImpl);
    const note = createLocalNote({ id: 'note-1', title: 'Transactions', folderId: null, now: 1 });
    note.content = '# ACID';
    note.linkedChatIds = ['chat-private'];

    const result = await bridge.writeNote('secret-token', note);

    expect(result.path).toBe('Chatspace/Transactions-note-1.md');
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(`${LOCAL_BRIDGE_ORIGIN}/notes`);
    expect(init?.headers).toEqual({
      Authorization: 'Bearer secret-token',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      id: 'note-1',
      title: 'Transactions',
      markdown: '# ACID',
    });
  });

  it('rejects malformed write responses', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const bridge = new HttpLocalVaultBridge(fetchImpl);
    const note = createLocalNote({ id: 'note-1', title: 'Transactions', folderId: null, now: 1 });

    await expect(bridge.writeNote('token', note)).rejects.toThrow('invalid response');
  });
});
