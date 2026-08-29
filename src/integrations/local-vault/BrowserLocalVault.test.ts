import { describe, expect, it, vi } from 'vitest';

import { createLocalNote } from '../../domain/workspace/model';
import { BrowserLocalVault } from './BrowserLocalVault';
import type {
  DirectoryHandleStore,
  VaultDirectoryHandle,
  VaultFileHandle,
  VaultPermissionState,
  VaultWritable,
} from './directoryHandleStore';

class MemoryHandleStore implements DirectoryHandleStore {
  handle: VaultDirectoryHandle | null = null;

  async load() {
    return this.handle;
  }

  async save(handle: VaultDirectoryHandle) {
    this.handle = handle;
  }

  async clear() {
    this.handle = null;
  }
}

function fakeVault(permission: VaultPermissionState = 'granted') {
  const write = vi.fn(async (_data: string) => undefined);
  const close = vi.fn(async () => undefined);
  const writable: VaultWritable = { write, close };
  const createWritable = vi.fn(async () => writable);
  const fileHandle: VaultFileHandle = { createWritable };
  const getFileHandle = vi.fn(async (_name: string, _options: { create: boolean }) => fileHandle);
  const chatspaceDirectory = {
    name: 'Chatspace',
    queryPermission: vi.fn(async () => permission),
    requestPermission: vi.fn(async () => permission),
    getDirectoryHandle: vi.fn(),
    getFileHandle,
  } as unknown as VaultDirectoryHandle;
  const getDirectoryHandle = vi.fn(async (_name: string, _options: { create: boolean }) => chatspaceDirectory);
  const requestPermission = vi.fn(async () => 'granted' as const);
  const queryPermission = vi.fn(async () => permission);
  const handle: VaultDirectoryHandle = {
    name: 'Second Brain',
    queryPermission,
    requestPermission,
    getDirectoryHandle,
    getFileHandle,
  };

  return {
    handle,
    write,
    close,
    queryPermission,
    requestPermission,
    getDirectoryHandle,
    getFileHandle,
  };
}

describe('BrowserLocalVault', () => {
  it('persists a selected vault and reports its permission', async () => {
    const store = new MemoryHandleStore();
    const vault = fakeVault('granted');
    const picker = vi.fn(async () => vault.handle);
    const integration = new BrowserLocalVault(store, picker);

    const connection = await integration.connect();

    expect(connection).toEqual({ name: 'Second Brain', permission: 'granted' });
    expect(store.handle).toBe(vault.handle);
    expect(picker).toHaveBeenCalledWith({ id: 'chatspace-obsidian-vault', mode: 'readwrite' });
  });

  it('keeps the existing connection when the folder picker is cancelled', async () => {
    const store = new MemoryHandleStore();
    const existing = fakeVault('granted');
    store.handle = existing.handle;
    const picker = vi.fn(async () => {
      throw { name: 'AbortError' };
    });
    const integration = new BrowserLocalVault(store, picker);

    await expect(integration.connect()).resolves.toBeNull();
    expect(store.handle).toBe(existing.handle);
  });

  it('requests write permission again from a persisted handle', async () => {
    const store = new MemoryHandleStore();
    const vault = fakeVault('prompt');
    store.handle = vault.handle;
    const integration = new BrowserLocalVault(store, vi.fn());

    const connection = await integration.reconnect();

    expect(vault.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(connection).toEqual({ name: 'Second Brain', permission: 'granted' });
  });

  it('writes only note markdown below the Chatspace directory using a stable filename', async () => {
    const store = new MemoryHandleStore();
    const vault = fakeVault('granted');
    store.handle = vault.handle;
    const integration = new BrowserLocalVault(store, vi.fn());
    const note = createLocalNote({ id: 'note-1', title: 'Transactions', folderId: null, now: 1 });
    note.content = '# ACID';
    note.linkedChatIds = ['chat-private'];

    const result = await integration.writeNote(note);

    expect(result.path).toBe('Chatspace/Transactions-note-1.md');
    expect(vault.getDirectoryHandle).toHaveBeenCalledWith('Chatspace', { create: true });
    expect(vault.getFileHandle).toHaveBeenCalledWith('Transactions-note-1.md', { create: true });
    expect(vault.write).toHaveBeenCalledWith('# ACID');
    expect(vault.close).toHaveBeenCalledOnce();
  });

  it('refuses to write when the persisted handle no longer has write permission', async () => {
    const store = new MemoryHandleStore();
    store.handle = fakeVault('prompt').handle;
    const integration = new BrowserLocalVault(store, vi.fn());
    const note = createLocalNote({ id: 'note-1', title: 'Transactions', folderId: null, now: 1 });

    await expect(integration.writeNote(note)).rejects.toThrow('permission is required');
  });

  it('removes the persisted handle on disconnect', async () => {
    const store = new MemoryHandleStore();
    store.handle = fakeVault('granted').handle;
    const integration = new BrowserLocalVault(store, vi.fn());

    await integration.disconnect();

    expect(store.handle).toBeNull();
  });
});
