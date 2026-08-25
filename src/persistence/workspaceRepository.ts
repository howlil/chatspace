import type { WorkspaceSnapshot } from '../domain/workspace/model';

export interface WorkspaceRepository {
  load(): Promise<WorkspaceSnapshot | null>;
  save(snapshot: WorkspaceSnapshot): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  private snapshot: WorkspaceSnapshot | null;

  constructor(initial: WorkspaceSnapshot | null = null) {
    this.snapshot = initial;
  }

  async load(): Promise<WorkspaceSnapshot | null> {
    return this.snapshot;
  }

  async save(snapshot: WorkspaceSnapshot): Promise<void> {
    this.snapshot = snapshot;
  }

  async clear(): Promise<void> {
    this.snapshot = null;
  }
}
