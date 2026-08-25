import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createChatReference, createLocalNote } from '../../domain/workspace/model';
import { LocalNoteEditor } from './LocalNoteEditor';

afterEach(() => cleanup());

describe('LocalNoteEditor', () => {
  it('edits Markdown and explicitly links a local chat reference', () => {
    const note = createLocalNote({ id: 'note-1', title: 'TCP', folderId: null, now: 1 });
    const chat = createChatReference({ id: 'chat-1', label: 'TCP discussion', target: 'https://chatgpt.com/c/tcp', folderId: null, now: 1 });
    const onChange = vi.fn();
    const onLinkChat = vi.fn();

    render(<LocalNoteEditor note={note} chats={[chat]} onChange={onChange} onLinkChat={onLinkChat} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Markdown content' }), { target: { value: '# TCP\nReliable byte stream' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ content: '# TCP\nReliable byte stream' }));

    fireEvent.click(screen.getByRole('button', { name: 'Link chat' }));
    expect(onLinkChat).toHaveBeenCalledWith('chat-1');
  });

  it('previews Markdown as safe React content without injecting raw HTML', () => {
    const note = {
      ...createLocalNote({ id: 'note-1', title: 'TCP', folderId: null, now: 1 }),
      content: '# TCP\n<script>alert(1)</script>\n- reliable stream',
    };

    render(<LocalNoteEditor note={note} chats={[]} onChange={vi.fn()} onLinkChat={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByRole('article', { name: 'Markdown preview' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'TCP' })).toBeVisible();
    expect(screen.getByText('<script>alert(1)</script>')).toBeVisible();
    expect(document.querySelector('script')).toBeNull();
  });

  it('adds local note tags as explicit metadata', () => {
    const note = createLocalNote({ id: 'note-1', title: 'TCP', folderId: null, now: 1 });
    const onChange = vi.fn();

    render(<LocalNoteEditor note={note} chats={[]} onChange={onChange} onLinkChat={vi.fn()} />);
    const input = screen.getByRole('textbox', { name: 'Add note tag' });
    fireEvent.change(input, { target: { value: 'networking' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ tags: ['networking'] }));
  });
});
