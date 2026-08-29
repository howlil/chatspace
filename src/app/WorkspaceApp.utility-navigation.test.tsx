import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MemoryWorkspaceRepository } from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

describe('WorkspaceApp utility navigation', () => {
  it('exposes an explicit way back from Markdown sync', () => {
    const onBackToWorkspace = vi.fn();

    render(
      <WorkspaceApp
        repository={new MemoryWorkspaceRepository()}
        currentUrl={() => 'https://chatgpt.com/'}
        view="markdown-sync"
        onBackToWorkspace={onBackToWorkspace}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back to workspace' }));
    expect(onBackToWorkspace).toHaveBeenCalledOnce();
  });
});
