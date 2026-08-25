import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createChatReference, createFolder, createInitialWorkspace } from '../domain/workspace/model';
import { MemoryWorkspaceRepository } from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

describe('WorkspaceApp', () => {
  it('hydrates nested local state and persists user-created folders', async () => {
    const initial = createInitialWorkspace(1);
    initial.folders = [createFolder({ id:'root-folder', name:'Backend', parentId:null, now:1 }), createFolder({ id:'child-folder', name:'Databases', parentId:'root-folder', now:1 })];
    const repository = new MemoryWorkspaceRepository(initial);
    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);
    expect(await screen.findByText('Databases')).toBeVisible();
    fireEvent.click(screen.getByText('Backend'));
    fireEvent.click(screen.getByRole('button', { name:'New folder' }));
    await waitFor(async () => { const saved = await repository.load(); expect(saved?.folders).toHaveLength(3); expect(saved?.folders[2]?.parentId).toBe('root-folder'); });
  });

  it('saves an explicit URL-only reference and opens it as a workspace tab', async () => {
    const repository = new MemoryWorkspaceRepository();
    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/c/abc-123?utm_source=test'} />);
    fireEvent.click(await screen.findByRole('button', { name:'Save current chat' }));
    await waitFor(async () => { const saved = await repository.load(); expect(saved?.chatRefs[0]?.target).toBe('https://chatgpt.com/c/abc-123'); expect(saved?.tabs.some((tab) => tab.kind === 'chat')).toBe(true); });
  });

  it('opens the local command palette and graph tab', async () => {
    render(<WorkspaceApp repository={new MemoryWorkspaceRepository()} currentUrl={() => 'https://chatgpt.com/'} />);
    await screen.findByText('Local workspace ready.');
    fireEvent.keyDown(window, { key:'k', ctrlKey:true });
    fireEvent.click(screen.getByRole('button', { name:'Open graph' }));
    expect(screen.getByRole('tab', { name:'Graph' })).toHaveAttribute('aria-selected','true');
  });

  it('navigates a saved chat only through the validated URL adapter', async () => {
    const initial = createInitialWorkspace(1);
    initial.chatRefs = [createChatReference({ id:'chat-one', label:'Production debugging', target:'https://chatgpt.com/c/abc-123', folderId:null, now:1 })];
    const navigate = vi.fn();
    render(<WorkspaceApp repository={new MemoryWorkspaceRepository(initial)} currentUrl={() => 'https://chatgpt.com/c/current'} navigate={navigate} />);
    fireEvent.click(await screen.findByRole('button', { name:'Production debugging' }));
    expect(navigate).toHaveBeenCalledWith('https://chatgpt.com/c/abc-123');
    expect(screen.getByText('Conversation detected')).toBeVisible();
  });

  it('creates, edits, links, and persists a local Markdown note', async () => {
    const initial = createInitialWorkspace(1);
    initial.chatRefs = [createChatReference({ id:'chat-one', label:'Database discussion', target:'https://chatgpt.com/c/db', folderId:null, now:1 })];
    const repository = new MemoryWorkspaceRepository(initial);
    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    fireEvent.click(await screen.findByRole('button', { name:'New note' }));
    fireEvent.change(screen.getByRole('textbox', { name:'Note title' }), { target:{ value:'Transactions' } });
    fireEvent.change(screen.getByRole('textbox', { name:'Markdown content' }), { target:{ value:'# ACID\nAtomicity matters.' } });
    fireEvent.click(screen.getByRole('button', { name:'Link chat' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.notes).toHaveLength(1);
      expect(saved?.notes[0]?.title).toBe('Transactions');
      expect(saved?.notes[0]?.content).toContain('Atomicity');
      expect(saved?.notes[0]?.linkedChatIds).toEqual(['chat-one']);
    });
  });
});
