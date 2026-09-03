import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createChatReference, createInitialWorkspace, createLocalNote } from '../domain/workspace/model';
import { MemoryWorkspaceRepository } from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

describe('WorkspaceApp M18 daily-use flow', () => {
  it('shows the current conversation on Home and prefills capture from safe browser-tab metadata', async () => {
    render(
      <WorkspaceApp
        repository={new MemoryWorkspaceRepository(createInitialWorkspace(1))}
        currentUrl={() => 'https://chatgpt.com/c/isolation'}
        currentTitle={() => 'Database isolation - ChatGPT'}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Current conversation' })).toBeVisible();
    expect(screen.getByText('Database isolation')).toBeVisible();
    expect(screen.getByText('Not saved yet')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('textbox', { name: 'Conversation name' })).toHaveValue('Database isolation');
  });

  it('keeps pinned chats out of Continue while preserving them as stable shortcuts', async () => {
    const initial = createInitialWorkspace(1);
    initial.chatRefs = [
      {
        ...createChatReference({ id: 'chat-pinned', label: 'Backend roadmap', target: 'https://chatgpt.com/c/pinned', folderId: null, now: 2 }),
        pinned: true,
        updatedAt: 50,
      },
      {
        ...createChatReference({ id: 'chat-recent', label: 'API design', target: 'https://chatgpt.com/c/recent', folderId: null, now: 3 }),
        updatedAt: 40,
      },
    ];
    initial.notes = [{ ...createLocalNote({ id: 'note-one', title: 'Caching notes', folderId: null, now: 4 }), updatedAt: 45 }];

    render(<WorkspaceApp repository={new MemoryWorkspaceRepository(initial)} currentUrl={() => 'https://chatgpt.com/'} />);

    const continueSection = (await screen.findByRole('heading', { name: 'Continue' })).closest('section');
    if (continueSection === null) throw new Error('Continue section missing');
    const continueView = within(continueSection);
    expect(continueView.getByText('Caching notes')).toBeVisible();
    expect(continueView.getByText('API design')).toBeVisible();
    expect(continueView.queryByText('Backend roadmap')).not.toBeInTheDocument();

    const pinnedSection = screen.getByRole('heading', { name: 'Pinned' }).closest('section');
    if (pinnedSection === null) throw new Error('Pinned section missing');
    expect(within(pinnedSection).getByText('Backend roadmap')).toBeVisible();
  });

  it('exposes Home Library Settings as primary jobs and keeps the Markdown vault inside Settings', async () => {
    const openMarkdownSync = vi.fn();
    render(
      <WorkspaceApp
        repository={new MemoryWorkspaceRepository(createInitialWorkspace(1))}
        currentUrl={() => 'https://chatgpt.com/'}
        onOpenMarkdownSync={openMarkdownSync}
      />,
    );

    const primaryNavigation = await screen.findByRole('navigation', { name: 'Primary navigation' });
    expect(within(primaryNavigation).getByRole('button', { name: 'Home' })).toBeVisible();
    expect(within(primaryNavigation).getByRole('button', { name: 'Library' })).toBeVisible();
    expect(within(primaryNavigation).getByRole('button', { name: 'Settings' })).toBeVisible();
    expect(within(primaryNavigation).getByRole('button', { name: 'More' })).toBeVisible();

    fireEvent.click(within(primaryNavigation).getByRole('button', { name: 'Settings' }));
    expect(await screen.findByText('Markdown vault')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Open integration' }));
    expect(openMarkdownSync).toHaveBeenCalledOnce();
  });
});
