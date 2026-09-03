import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { createInitialWorkspace, createLocalNote } from '../domain/workspace/model';
import { MemoryWorkspaceRepository } from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

describe('WorkspaceApp structured knowledge', () => {
  it('edits a typed text property on the active local note and persists it canonically', async () => {
    const initial = createInitialWorkspace(1);
    const note = createLocalNote({ id: 'note-one', title: 'Storage', folderId: null, now: 1 });
    initial.notes = [note];
    initial.tabs = [
      ...initial.tabs,
      { id: 'tab-note-one', kind: 'note', entityId: note.id, title: note.title, pinned: false },
    ];
    initial.activeTabId = 'tab-note-one';
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    expect(await screen.findByLabelText('Note properties')).toBeVisible();
    fireEvent.change(screen.getByRole('textbox', { name: 'Property name' }), { target: { value: 'status' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Property value' }), { target: { value: 'research' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set' }));

    await waitFor(async () => {
      expect((await repository.load())?.notes[0]?.properties).toEqual({ status: 'research' });
    });
    expect(screen.getByText('status')).toBeVisible();
    expect(screen.getByText('research')).toBeVisible();
  });

  it('creates a normal note from the built-in Learning Note template through Quick Open', async () => {
    const repository = new MemoryWorkspaceRepository(createInitialWorkspace(1));
    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    await screen.findByText('Local workspace ready.');
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'New from template: Learning Note' }));
    expect(screen.getByRole('dialog', { name: 'New from Learning Note' })).toBeVisible();
    fireEvent.change(screen.getByRole('textbox', { name: 'Note title' }), { target: { value: 'TCP' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create note' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.notes).toHaveLength(1);
      expect(saved?.notes[0]).toMatchObject({
        title: 'TCP',
        properties: { type: 'learning', status: 'active' },
      });
      expect(saved?.notes[0]?.content).toContain('# Summary');
      expect(saved?.tabs.some((tab) => tab.kind === 'note' && tab.entityId === saved.notes[0]?.id)).toBe(true);
    });
  });

  it('quick-opens a persisted saved view as an AND-filtered projection without copying notes', async () => {
    const initial = createInitialWorkspace(1);
    initial.notes = [
      { ...createLocalNote({ id: 'storage', title: 'Storage', folderId: null, now: 1 }), properties: { status: 'research', topic: 'backend' } },
      { ...createLocalNote({ id: 'ui', title: 'UI polish', folderId: null, now: 1 }), properties: { status: 'research', topic: 'frontend' } },
    ];
    initial.savedViews = [{
      id: 'view-backend-research',
      name: 'Backend research',
      filters: [
        { property: 'status', value: 'research' },
        { property: 'topic', value: 'backend' },
      ],
      createdAt: 1,
      updatedAt: 1,
    }];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    await screen.findByText('Local workspace ready.');
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Backend research' }));

    expect(await screen.findByLabelText('Saved view Backend research')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Storage' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'UI polish' })).not.toBeInTheDocument();
    expect((await repository.load())?.notes).toHaveLength(2);
  });
});