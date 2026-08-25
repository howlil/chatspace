import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createFolder, createInitialWorkspace } from '../domain/workspace/model';
import { MemoryWorkspaceRepository } from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

describe('WorkspaceApp persistence', () => {
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

  it('saves an explicit URL-only reference for the current ChatGPT conversation', async () => {
    const repository = new MemoryWorkspaceRepository();
    render(
      <WorkspaceApp
        repository={repository}
        currentUrl={() => 'https://chatgpt.com/c/abc-123?utm_source=test'}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Save current chat' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.chatRefs).toHaveLength(1);
      expect(saved?.chatRefs[0]?.target).toBe('https://chatgpt.com/c/abc-123');
    });
  });
});
