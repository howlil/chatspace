import { describe, expect, it, vi } from 'vitest';

import { createInitialWorkspace, createLocalNote } from '../../domain/workspace/model';
import { exportWorkspaceJson } from '../../domain/workspace/io';
import { buildPortableWorkspaceBundle } from '../../domain/workspace/portableExport';
import {
  exportPortableWorkspaceJson,
  writePortableWorkspaceBundle,
  type PortableDirectoryHandle,
  type PortableFileHandle,
  type PortableWritable,
} from './BrowserPortableWorkspaceExporter';

class MemoryDirectory implements PortableDirectoryHandle {
  readonly directories = new Map<string, MemoryDirectory>();
  readonly files = new Map<string, string>();

  constructor(readonly name: string) {}

  async getDirectoryHandle(name: string): Promise<PortableDirectoryHandle> {
    const existing = this.directories.get(name);
    if (existing !== undefined) return existing;
    const created = new MemoryDirectory(name);
    this.directories.set(name, created);
    return created;
  }

  async getFileHandle(name: string): Promise<PortableFileHandle> {
    const owner = this;
    return {
      async createWritable(): Promise<PortableWritable> {
        let content = '';
        return {
          async write(data: string) {
            content = data;
          },
          async close() {
            owner.files.set(name, content);
          },
        };
      },
    };
  }

  directory(path: string): MemoryDirectory | undefined {
    return path.split('/').filter(Boolean).reduce<MemoryDirectory | undefined>(
      (current, segment) => current?.directories.get(segment),
      this,
    );
  }
}

describe('portable workspace folder export', () => {
  it('writes the projected bundle beneath one explicit export root', async () => {
    const snapshot = createInitialWorkspace(1);
    snapshot.notes = [{
      ...createLocalNote({ id: 'note-1', title: 'Portable', folderId: null, now: 2 }),
      content: 'Local Markdown',
    }];
    const bundle = buildPortableWorkspaceBundle(snapshot, 0);
    const destination = new MemoryDirectory('Exports');

    const result = await writePortableWorkspaceBundle(destination, bundle);

    expect(result).toEqual({
      destinationName: 'Exports',
      rootDirectoryName: bundle.rootDirectoryName,
      filesWritten: bundle.files.length,
    });
    const root = destination.directory(bundle.rootDirectoryName);
    expect(root?.files.get('manifest.json')).toContain('"providerContentIncluded": false');
    expect(root?.directory('notes/_root')?.files.get('Portable--note-1.md')).toContain('Local Markdown');
  });

  it('uses the caller-provided directory picker and treats user cancellation as no export', async () => {
    const snapshot = createInitialWorkspace(1);
    const destination = new MemoryDirectory('Exports');
    const picker = vi.fn(async () => destination);

    const result = await exportPortableWorkspaceJson(exportWorkspaceJson(snapshot), picker);
    expect(result?.destinationName).toBe('Exports');
    expect(picker).toHaveBeenCalledWith({ id: 'chatspace-portable-export', mode: 'readwrite' });

    const cancelledPicker = vi.fn(async () => {
      throw new DOMException('Cancelled', 'AbortError');
    });
    await expect(exportPortableWorkspaceJson(exportWorkspaceJson(snapshot), cancelledPicker)).resolves.toBeNull();
  });
});
