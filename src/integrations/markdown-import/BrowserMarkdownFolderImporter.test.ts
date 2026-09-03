import { describe, expect, it } from 'vitest';

import { exportWorkspaceJson } from '../../domain/workspace/io';
import { createInitialWorkspace } from '../../domain/workspace/model';
import {
  scanMarkdownFolder,
  type MarkdownDirectoryHandle,
  type MarkdownFileHandle,
} from './BrowserMarkdownFolderImporter';

function file(name: string, content: string): MarkdownFileHandle {
  return {
    kind: 'file',
    name,
    getFile: async () => ({ text: async () => content }),
  };
}

function directory(name: string, children: Array<MarkdownFileHandle | MarkdownDirectoryHandle>): MarkdownDirectoryHandle {
  return {
    kind: 'directory',
    name,
    async *entries() {
      for (const child of children) yield [child.name, child] as [string, MarkdownFileHandle | MarkdownDirectoryHandle];
    },
  };
}

describe('BrowserMarkdownFolderImporter', () => {
  it('recursively reads only Markdown files and returns a read-only domain scan', async () => {
    const root = directory('Knowledge', [
      file('Root.md', '# Root\nSee [[TCP]].'),
      file('ignore.txt', 'not markdown'),
      directory('Backend', [file('TCP.md', '---\ntags: [networking]\n---\n# TCP')]),
    ]);
    const scan = await scanMarkdownFolder(
      exportWorkspaceJson(createInitialWorkspace(5)),
      async (options) => {
        expect(options).toEqual({ mode: 'read' });
        return root;
      },
    );

    expect(scan?.rootName).toBe('Knowledge');
    expect(scan?.notes.map((note) => note.sourcePath)).toEqual(['Backend/TCP.md', 'Root.md']);
    expect(scan?.folderCount).toBe(1);
    expect(scan?.resolvedLinks).toBe(1);
  });

  it('treats picker cancellation as a no-op', async () => {
    const abort = new DOMException('cancelled', 'AbortError');
    const result = await scanMarkdownFolder(
      exportWorkspaceJson(createInitialWorkspace(5)),
      async () => Promise.reject(abort),
    );
    expect(result).toBeNull();
  });
});