import type { LocalNote } from '../../domain/workspace/model';
import type {
  DirectoryHandleStore,
  VaultDirectoryHandle,
  VaultPermissionState,
} from './directoryHandleStore';
import { IndexedDbDirectoryHandleStore } from './directoryHandleStore';
import { noteFilename } from './filename';

export interface VaultConnection {
  name: string;
  permission: VaultPermissionState;
}

export interface VaultWriteResult {
  path: string;
}

export interface LocalVault {
  isSupported(): boolean;
  getConnection(): Promise<VaultConnection | null>;
  connect(): Promise<VaultConnection | null>;
  reconnect(): Promise<VaultConnection | null>;
  disconnect(): Promise<void>;
  writeNote(note: LocalNote): Promise<VaultWriteResult>;
}

export type DirectoryPicker = (options: {
  id: string;
  mode: 'readwrite';
}) => Promise<VaultDirectoryHandle>;

const PERMISSION_OPTIONS = { mode: 'readwrite' } as const;
const PICKER_OPTIONS = { id: 'chatspace-obsidian-vault', mode: 'readwrite' } as const;
const CHATSPACE_DIRECTORY = 'Chatspace';

function defaultDirectoryPicker(options: typeof PICKER_OPTIONS): Promise<VaultDirectoryHandle> {
  const picker = (window as Window & {
    showDirectoryPicker?: DirectoryPicker;
  }).showDirectoryPicker;

  if (picker === undefined) {
    return Promise.reject(new Error('Direct folder access is not supported in this browser.'));
  }

  return picker.call(window, options);
}

function pickerIsAvailable(): boolean {
  return typeof window !== 'undefined'
    && typeof (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

function isPickerCancellation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'name' in error
    && (error as { name?: unknown }).name === 'AbortError';
}

async function connectionFromHandle(handle: VaultDirectoryHandle): Promise<VaultConnection> {
  return {
    name: handle.name,
    permission: await handle.queryPermission(PERMISSION_OPTIONS),
  };
}

export class BrowserLocalVault implements LocalVault {
  constructor(
    private readonly store: DirectoryHandleStore = new IndexedDbDirectoryHandleStore(),
    private readonly picker: DirectoryPicker = defaultDirectoryPicker,
  ) {}

  isSupported(): boolean {
    return pickerIsAvailable() && typeof indexedDB !== 'undefined';
  }

  async getConnection(): Promise<VaultConnection | null> {
    const handle = await this.store.load();
    return handle === null ? null : connectionFromHandle(handle);
  }

  async connect(): Promise<VaultConnection | null> {
    try {
      const handle = await this.picker(PICKER_OPTIONS);
      const permission = await handle.queryPermission(PERMISSION_OPTIONS);
      await this.store.save(handle);
      return { name: handle.name, permission };
    } catch (error) {
      if (isPickerCancellation(error)) return null;
      throw error;
    }
  }

  async reconnect(): Promise<VaultConnection | null> {
    const handle = await this.store.load();
    if (handle === null) return null;
    const permission = await handle.requestPermission(PERMISSION_OPTIONS);
    return { name: handle.name, permission };
  }

  async disconnect(): Promise<void> {
    await this.store.clear();
  }

  async writeNote(note: LocalNote): Promise<VaultWriteResult> {
    const handle = await this.store.load();
    if (handle === null) throw new Error('Connect an Obsidian vault before syncing a note.');

    const permission = await handle.queryPermission(PERMISSION_OPTIONS);
    if (permission !== 'granted') {
      throw new Error('Obsidian vault permission is required before syncing.');
    }

    const chatspaceDirectory = await handle.getDirectoryHandle(CHATSPACE_DIRECTORY, { create: true });
    const filename = noteFilename(note.title, note.id);
    const fileHandle = await chatspaceDirectory.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(note.content);
    await writable.close();

    return { path: `${CHATSPACE_DIRECTORY}/${filename}` };
  }
}
