import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { INBOX_FOLDER_ID, createChatReference, createInitialWorkspace } from '../domain/workspace/model';
import { MemoryWorkspaceRepository } from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

describe('WorkspaceApp quick capture', () => {
  it('captures one local note into Inbox and links only an already-saved current chat reference', async () => {
    const snapshot = createInitialWorkspace(1);
    snapshot.chatRefs = [createChatReference({
      id: 'chat-current',
      label: 'Current architecture chat',
      target: 'https://chatgpt.com/c/abc-123',
      folderId: null,
      now: 2,
    })];
    const repository = new MemoryWorkspaceRepository(snapshot);

    render(
      <WorkspaceApp
        repository={repository}
        currentUrl={() => 'https://chatgpt.com/c/abc-123'}
      />,
    );

    await screen.findByRole('button', { name: 'Quick capture' });
    fireEvent.keyDown(window, { key: 'n', ctrlKey: true, shiftKey: true });
    const capture = await screen.findByRole('textbox', { name: 'Quick capture' });
    fireEvent.change(capture, { target: { value: 'Retry semantics\nInvestigate idempotent retry behavior.' } });
    fireEvent.keyDown(capture, { key: 'Enter' });

    await waitFor(async () => {
      const saved = await repository.load();
      const inboxNote = saved?.notes.find((note) => note.folderId === INBOX_FOLDER_ID);
      expect(inboxNote?.title).toBe('Retry semantics');
      expect(inboxNote?.content).toContain('idempotent retry behavior');
      expect(inboxNote?.linkedChatIds).toEqual(['chat-current']);
    });
    expect(screen.queryByRole('textbox', { name: 'Quick capture' })).not.toBeInTheDocument();
  });

  it('does not create a conversation reference when the current ChatGPT URL is not already saved', async () => {
    const repository = new MemoryWorkspaceRepository(createInitialWorkspace(1));
    render(
      <WorkspaceApp
        repository={repository}
        currentUrl={() => 'https://chatgpt.com/c/not-saved'}
      />,
    );

    await screen.findByRole('button', { name: 'Quick capture' });
    fireEvent.click(screen.getByRole('button', { name: 'Quick capture' }));
    const capture = await screen.findByRole('textbox', { name: 'Quick capture' });
    fireEvent.change(capture, { target: { value: 'Capture first' } });
    fireEvent.keyDown(capture, { key: 'Enter' });

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.chatRefs).toHaveLength(0);
      expect(saved?.notes.find((note) => note.folderId === INBOX_FOLDER_ID)?.linkedChatIds).toEqual([]);
    });
  });
});