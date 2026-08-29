export type VaultPermissionState = 'granted' | 'prompt' | 'denied';

export interface VaultWritable {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

export interface VaultFileHandle {
  createWritable(): Promise<VaultWritable>;
}

export interface VaultDirectoryHandle {
  readonly name: string;
  queryPermission(options: { mode: 'readwrite' }): Promise<VaultPermissionState>;
  requestPermission(options: { mode: 'readwrite' }): Promise<VaultPermissionState>;
  getDirectoryHandle(name: string, options: { create: boolean }): Promise<VaultDirectoryHandle>;
  getFileHandle(name: string, options: { create: boolean }): Promise<VaultFileHandle>;
}

export interface DirectoryHandleStore {
  load(): Promise<VaultDirectoryHandle | null>;
  save(handle: VaultDirectoryHandle): Promise<void>;
  clear(): Promise<void>;
}

const DATABASE_NAME = 'chatspace-integrations';
const DATABASE_VERSION = 1;
const STORE_NAME = 'directory-handles';
const VAULT_KEY = 'obsidian-vault';

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable in this browser context.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Could not open integration storage.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Integration storage transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Integration storage transaction was aborted.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Integration storage request failed.'));
  });
}

export class IndexedDbDirectoryHandleStore implements DirectoryHandleStore {
  async load(): Promise<VaultDirectoryHandle | null> {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(VAULT_KEY);
      const result = await requestResult<unknown>(request);
      await transactionDone(transaction);
      return result === undefined ? null : result as VaultDirectoryHandle;
    } finally {
      database.close();
    }
  }

  async save(handle: VaultDirectoryHandle): Promise<void> {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(handle, VAULT_KEY);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  async clear(): Promise<void> {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(VAULT_KEY);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }
}
