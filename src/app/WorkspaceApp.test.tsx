import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createChatReference,
  createFolder,
  createInitialWorkspace,
  type WorkspaceSnapshot,
} from '../domain/workspace/model';
import {
  MemoryWorkspaceRepository,
  WorkspaceCorruptionError,
  type WorkspaceRepository,
} from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

class CorruptWorkspaceRepository implements WorkspaceRepository {
  saveCalls = 0;

  async load(): Promise<WorkspaceSnapshot | null> {
    throw new WorkspaceCorruptionError();
  }

  async save(): Promise<void> {
    this.saveCalls += 1;
  }

  async clear(): Promise<void> {}

  async readRaw(): Promise<unknown | null> {
    return { schemaVersion: 999, broken: true };
  }
}

describe('WorkspaceApp', () => {
  it('hydrates nested local state and persists user-created folders', async () => {
    const initial = createInitialWorkspace(1);
    initial.folders = [
      createFolder({ id: 'root-folder', name: 'Backend', parentId: null, now: 1 }),
      createFolder({ id: 'child-folder', name: 'Databases', parentId: 'root-folder', now: 1 }),
    ];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    expect(await screen.findByText('Databases')).toBeVisible();
    fireEvent.click(screen.getByText('Backend'));
    fireEvent.click(screen.getByRole('button', { name: 'New folder' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.folders).toHaveLength(3);
      expect(saved?.folders[2]?.parentId).toBe('root-folder');
    });
  });

  it('saves a named conversation into a chosen folder and optionally pins it', async () => {
    const initial = createInitialWorkspace(1);
    initial.folders = [createFolder({ id: 'database', name: 'Database', parentId: null, now: 1 })];
    const repository = new MemoryWorkspaceRepository(initial);

    render(
      <WorkspaceApp
        repository={repository}
        currentUrl={() => 'https://chatgpt.com/c/abc-123?utm_source=test'}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Save current chat' }));
    expect(screen.getByRole('dialog', { name: 'Save conversation' })).toBeVisible();
    fireEvent.change(screen.getByRole('textbox', { name: 'Conversation name' }), {
      target: { value: 'PostgreSQL locking' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Conversation folder' }), {
      target: { value: 'database' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pin this conversation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.chatRefs[0]).toMatchObject({
        label: 'PostgreSQL locking',
        target: 'https://chatgpt.com/c/abc-123',
        folderId: 'database',
        pinned: true,
      });
      expect(saved?.tabs.some((tab) => tab.kind === 'chat')).toBe(true);
    });
  });

  it('opens the local command palette and graph tab', async () => {
    render(
      <WorkspaceApp
        repository={new MemoryWorkspaceRepository()}
        currentUrl={() => 'https://chatgpt.com/'}
      />,
    );

    await screen.findByText('Local workspace ready.');
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Open graph' }));
    expect(screen.getByRole('tab', { name: 'Graph' })).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates a saved chat only through the validated URL adapter', async () => {
    const initial = createInitialWorkspace(1);
    initial.chatRefs = [
      createChatReference({
        id: 'chat-one',
        label: 'Production debugging',
        target: 'https://chatgpt.com/c/abc-123',
        folderId: null,
        now: 1,
      }),
    ];
    const navigate = vi.fn();

    render(
      <WorkspaceApp
        repository={new MemoryWorkspaceRepository(initial)}
        currentUrl={() => 'https://chatgpt.com/c/current'}
        navigate={navigate}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Production debugging' }));
    expect(navigate).toHaveBeenCalledWith('https://chatgpt.com/c/abc-123');
    expect(screen.getByText('Conversation detected')).toBeVisible();
  });

  it('creates, edits, links, and persists a local Markdown note', async () => {
    const initial = createInitialWorkspace(1);
    initial.chatRefs = [
      createChatReference({
        id: 'chat-one',
        label: 'Database discussion',
        target: 'https://chatgpt.com/c/db',
        folderId: null,
        now: 1,
      }),
    ];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    fireEvent.click(await screen.findByRole('button', { name: 'New note' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Note title' }), {
      target: { value: 'Transactions' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Markdown content' }), {
      target: { value: '# ACID\nAtomicity matters.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Link chat' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.notes[0]?.title).toBe('Transactions');
      expect(saved?.notes[0]?.content).toContain('Atomicity');
      expect(saved?.notes[0]?.linkedChatIds).toEqual(['chat-one']);
    });
  });

  it('persists explorer collapse and resize state as workspace layout', async () => {
    const repository = new MemoryWorkspaceRepository();
    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    await screen.findByText('Local workspace ready.');
    const separator = screen.getByRole('separator', { name: 'Resize explorer' });
    const initialWidth = Number(separator.getAttribute('aria-valuenow'));
    fireEvent.keyDown(separator, { key: 'ArrowRight' });

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.layout.treeWidth).toBe(initialWidth + 16);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Toggle explorer' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.layout.treeCollapsed).toBe(true);
    });
    expect(screen.queryByRole('navigation', { name: 'Workspace explorer' })).not.toBeInTheDocument();
  });

  it('does not overwrite corrupted storage and exposes the raw recovery payload', async () => {
    const repository = new CorruptWorkspaceRepository();
    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    const warning = await screen.findByRole('alert');
    expect(warning).toHaveTextContent('Storage recovery required');
    expect(repository.saveCalls).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Recover' }));
    const rawRecovery = screen.getByRole('textbox', {
      name: 'Raw recovery payload',
    }) as HTMLTextAreaElement;
    expect(rawRecovery.value).toContain('"broken": true');
    expect(repository.saveCalls).toBe(0);
  });
});
