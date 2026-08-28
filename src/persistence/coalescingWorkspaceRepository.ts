import type { WorkspaceSnapshot } from '../domain/workspace/model';
import type { WorkspaceRepository } from './workspaceRepository';

interface SaveWaiter {
  resolve(): void;
  reject(error: unknown): void;
}

export class CoalescingWorkspaceRepository implements WorkspaceRepository {
  private pendingSnapshot: WorkspaceSnapshot | null = null;
  private pendingWaiters: SaveWaiter[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private writeTail: Promise<void> = Promise.resolve();

  constructor(
    private readonly delegate: WorkspaceRepository,
    private readonly debounceMs = 100,
  ) {}

  load(): Promise<WorkspaceSnapshot | null> {
    return this.delegate.load();
  }

  save(snapshot: WorkspaceSnapshot): Promise<void> {
    this.pendingSnapshot = snapshot;

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    const completion = new Promise<void>((resolve, reject) => {
      this.pendingWaiters.push({ resolve, reject });
    });

    this.debounceTimer = setTimeout(() => this.flushPendingSave(), this.debounceMs);
    return completion;
  }

  async clear(): Promise<void> {
    this.cancelPendingSave();
    await this.writeTail.catch(() => undefined);
    await this.delegate.clear();
  }

  readRaw(): Promise<unknown | null> {
    return this.delegate.readRaw();
  }

  private flushPendingSave(): void {
    this.debounceTimer = null;

    const snapshot = this.pendingSnapshot;
    if (snapshot === null) return;

    const waiters = this.pendingWaiters;
    this.pendingSnapshot = null;
    this.pendingWaiters = [];

    const operation = this.writeTail
      .catch(() => undefined)
      .then(() => this.delegate.save(snapshot));

    this.writeTail = operation;

    void operation.then(
      () => {
        for (const waiter of waiters) waiter.resolve();
      },
      (error: unknown) => {
        for (const waiter of waiters) waiter.reject(error);
      },
    );
  }

  private cancelPendingSave(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.pendingSnapshot = null;
    const waiters = this.pendingWaiters;
    this.pendingWaiters = [];

    for (const waiter of waiters) waiter.resolve();
  }
}
