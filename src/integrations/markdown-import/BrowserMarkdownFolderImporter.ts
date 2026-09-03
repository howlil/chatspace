import { importWorkspaceJson } from '../../domain/workspace/io';
import {
  scanMarkdownImport,
  type MarkdownImportScan,
  type MarkdownSourceFile,
} from '../../domain/workspace/markdownImport';

export interface MarkdownFileLike {
  text(): Promise<string>;
}

export interface MarkdownFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<MarkdownFileLike>;
}

export interface MarkdownDirectoryHandle {
  kind: 'directory';
  name: string;
  entries(): AsyncIterableIterator<[string, MarkdownFileHandle | MarkdownDirectoryHandle]>;
}

export type MarkdownDirectoryPicker = (options?: { mode?: 'read' }) => Promise<MarkdownDirectoryHandle>;

function defaultDirectoryPicker(options?: { mode?: 'read' }): Promise<MarkdownDirectoryHandle> {
  const picker = (window as Window & { showDirectoryPicker?: MarkdownDirectoryPicker }).showDirectoryPicker;
  if (picker === undefined) return Promise.reject(new Error('Markdown folder import is not supported in this browser.'));
  return picker(options);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function collectMarkdownFiles(
  directory: MarkdownDirectoryHandle,
  prefix = '',
): Promise<MarkdownSourceFile[]> {
  const files: MarkdownSourceFile[] = [];
  const entries: Array<[string, MarkdownFileHandle | MarkdownDirectoryHandle]> = [];
  for await (const entry of directory.entries()) entries.push(entry);
  entries.sort(([left], [right]) => left.localeCompare(right));

  for (const [name, handle] of entries) {
    const path = prefix === '' ? name : `${prefix}/${name}`;
    if (handle.kind === 'directory') {
      files.push(...await collectMarkdownFiles(handle, path));
      continue;
    }
    if (!name.toLocaleLowerCase().endsWith('.md')) continue;
    const file = await handle.getFile();
    files.push({ path, content: await file.text() });
  }

  return files;
}

export function isMarkdownFolderImportSupported(): boolean {
  return typeof (window as Window & { showDirectoryPicker?: MarkdownDirectoryPicker }).showDirectoryPicker === 'function';
}

export async function scanMarkdownFolder(
  workspaceJson: string,
  picker: MarkdownDirectoryPicker = defaultDirectoryPicker,
): Promise<MarkdownImportScan | null> {
  const snapshot = importWorkspaceJson(workspaceJson);
  let directory: MarkdownDirectoryHandle;
  try {
    directory = await picker({ mode: 'read' });
  } catch (error) {
    if (isAbortError(error)) return null;
    throw error;
  }

  const files = await collectMarkdownFiles(directory);
  return scanMarkdownImport(snapshot, files, directory.name);
}