import { importWorkspaceJson } from '../../domain/workspace/io';
import { buildPortableWorkspaceBundle, type PortableWorkspaceBundle } from '../../domain/workspace/portableExport';

export interface PortableWritable {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

export interface PortableFileHandle {
  createWritable(): Promise<PortableWritable>;
}

export interface PortableDirectoryHandle {
  readonly name: string;
  getDirectoryHandle(name: string, options: { create: boolean }): Promise<PortableDirectoryHandle>;
  getFileHandle(name: string, options: { create: boolean }): Promise<PortableFileHandle>;
}

export type PortableDirectoryPicker = (options: {
  id: string;
  mode: 'readwrite';
}) => Promise<PortableDirectoryHandle>;

export interface PortableWorkspaceExportResult {
  destinationName: string;
  rootDirectoryName: string;
  filesWritten: number;
}

const PICKER_OPTIONS: Parameters<PortableDirectoryPicker>[0] = {
  id: 'chatspace-portable-export',
  mode: 'readwrite',
};

function defaultDirectoryPicker(options: Parameters<PortableDirectoryPicker>[0]): Promise<PortableDirectoryHandle> {
  const picker = (window as Window & { showDirectoryPicker?: PortableDirectoryPicker }).showDirectoryPicker;
  if (picker === undefined) {
    return Promise.reject(new Error('Direct folder export is not supported in this browser.'));
  }
  return picker.call(window, options);
}

function isPickerCancellation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'name' in error
    && (error as { name?: unknown }).name === 'AbortError';
}

export function isPortableWorkspaceExportSupported(): boolean {
  return typeof window !== 'undefined'
    && typeof (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

async function writeTextFile(directory: PortableDirectoryHandle, filename: string, content: string): Promise<void> {
  const fileHandle = await directory.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function writePortableWorkspaceBundle(
  destination: PortableDirectoryHandle,
  bundle: PortableWorkspaceBundle,
): Promise<PortableWorkspaceExportResult> {
  const root = await destination.getDirectoryHandle(bundle.rootDirectoryName, { create: true });

  for (const file of bundle.files) {
    const segments = file.path.split('/').filter((segment) => segment !== '');
    const filename = segments.pop();
    if (filename === undefined || segments.some((segment) => segment === '.' || segment === '..')) {
      throw new Error(`Invalid portable export path: ${file.path}`);
    }

    let directory = root;
    for (const segment of segments) {
      directory = await directory.getDirectoryHandle(segment, { create: true });
    }
    await writeTextFile(directory, filename, file.content);
  }

  return {
    destinationName: destination.name,
    rootDirectoryName: bundle.rootDirectoryName,
    filesWritten: bundle.files.length,
  };
}

export async function exportPortableWorkspaceJson(
  workspaceJson: string,
  picker: PortableDirectoryPicker = defaultDirectoryPicker,
): Promise<PortableWorkspaceExportResult | null> {
  const snapshot = importWorkspaceJson(workspaceJson);
  try {
    const destination = await picker(PICKER_OPTIONS);
    return await writePortableWorkspaceBundle(destination, buildPortableWorkspaceBundle(snapshot));
  } catch (error) {
    if (isPickerCancellation(error)) return null;
    throw error;
  }
}
