import { browser } from 'wxt/browser';

import { migrateWorkspaceSnapshot } from '../domain/workspace/io';
import type { WorkspaceSnapshot } from '../domain/workspace/model';
import { CoalescingWorkspaceRepository } from './coalescingWorkspaceRepository';
import {
  MemoryWorkspaceRepository,
  WorkspaceCorruptionError,
  type WorkspaceRepository,
} from './workspaceRepository';

const STORAGE_KEY = 'chatspace.workspace.v1';

export class ChromeStorageWorkspaceRepository implements WorkspaceRepository {
  async load(): Promise<WorkspaceSnapshot | null> {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const value: unknown = result[STORAGE_KEY];
    if (value === undefined) {
      return null;
    }
    const snapshot = migrateWorkspaceSnapshot(value);
    if (snapshot === null) {
      throw new WorkspaceCorruptionError();
    }
    return snapshot;
  }

  async save(snapshot: WorkspaceSnapshot): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEY]: snapshot });
  }

  async clear(): Promise<void> {
    await browser.storage.local.remove(STORAGE_KEY);
  }

  async readRaw(): Promise<unknown | null> {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const value: unknown = result[STORAGE_KEY];
    return value === undefined ? null : value;
  }
}

function hasExtensionRuntime(): boolean {
  const runtime = browser as unknown as { runtime?: { id?: string } } | undefined;
  return runtime?.runtime?.id !== undefined;
}

export function createDefaultWorkspaceRepository(): WorkspaceRepository {
  return hasExtensionRuntime()
    ? new CoalescingWorkspaceRepository(new ChromeStorageWorkspaceRepository())
    : new MemoryWorkspaceRepository();
}
