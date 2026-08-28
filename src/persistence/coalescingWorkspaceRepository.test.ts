import { afterEach, describe, expect, it, vi } from 'vitest';

import { createInitialWorkspace, type WorkspaceSnapshot } from '../domain/workspace/model';
import { CoalescingWorkspaceRepository } from './coalescingWorkspaceRepository';
import type { WorkspaceRepository } from './workspaceRepository';

class RecordingWorkspaceRepository implements WorkspaceRepository {
  readonly saved: WorkspaceSnapshot[] = [];

  async load(): Promise<WorkspaceSnapshot | null> {
    return null;
  }

  async save(snapshot: WorkspaceSnapshot): Promise<void> {
    this.saved.push(snapshot);
  }

  async clear(): Promise<void> {}

  async readRaw(): Promise<unknown | null> {
    return null;
  }
}

class DeferredWorkspaceRepository extends RecordingWorkspaceRepository {
  private readonly releases: Array<() => void> = [];

  override save(snapshot: WorkspaceSnapshot): Promise<void> {
    this.saved.push(snapshot);
    return new Promise<void>((resolve) => {
      this.releases.push(resolve);
    });
  }

  releaseNext(): void {
    const release = this.releases.shift();
    if (release === undefined) throw new Error('No persistence write is waiting.');
    release();
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe('CoalescingWorkspaceRepository', () => {
  it('coalesces rapid state changes into the latest physical write', async () => {
    vi.useFakeTimers();
    const delegate = new RecordingWorkspaceRepository();
    const repository = new CoalescingWorkspaceRepository(delegate, 50);

    const first = repository.save(createInitialWorkspace(1));
    const second = repository.save(createInitialWorkspace(2));
    const third = repository.save(createInitialWorkspace(3));

    await vi.advanceTimersByTimeAsync(49);
    expect(delegate.saved).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([first, second, third]);

    expect(delegate.saved).toHaveLength(1);
    expect(delegate.saved[0]?.updatedAt).toBe(3);
  });

  it('serializes physical writes when a later debounce window closes during an active write', async () => {
    vi.useFakeTimers();
    const delegate = new DeferredWorkspaceRepository();
    const repository = new CoalescingWorkspaceRepository(delegate, 50);

    const first = repository.save(createInitialWorkspace(1));
    await vi.advanceTimersByTimeAsync(50);
    expect(delegate.saved.map((snapshot) => snapshot.updatedAt)).toEqual([1]);

    const second = repository.save(createInitialWorkspace(2));
    await vi.advanceTimersByTimeAsync(50);
    expect(delegate.saved.map((snapshot) => snapshot.updatedAt)).toEqual([1]);

    delegate.releaseNext();
    await first;
    await Promise.resolve();
    await Promise.resolve();

    expect(delegate.saved.map((snapshot) => snapshot.updatedAt)).toEqual([1, 2]);

    delegate.releaseNext();
    await second;
  });
});
