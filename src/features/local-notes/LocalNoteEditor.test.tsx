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

    render(
      <LocalNoteEditor
        note={note}
        chats={[chat]}
        contextExpanded
        onChange={onChange}
        onLinkChat={onLinkChat}
        onToggleContext={vi.fn()}
      />,
    );
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

    render(
      <LocalNoteEditor
        note={note}
        chats={[]}
        contextExpanded
        onChange={vi.fn()}
        onLinkChat={vi.fn()}
        onToggleContext={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview note' }));

    expect(screen.getByRole('article', { name: 'Markdown preview' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'TCP' })).toBeVisible();
    expect(screen.getByText('<script>alert(1)</script>')).toBeVisible();
    expect(document.querySelector('script')).toBeNull();
  });

  it('adds local note tags as explicit metadata', () => {
    const note = createLocalNote({ id: 'note-1', title: 'TCP', folderId: null, now: 1 });
    const onChange = vi.fn();

    render(
      <LocalNoteEditor
        note={note}
        chats={[]}
        contextExpanded
        onChange={onChange}
        onLinkChat={vi.fn()}
        onToggleContext={vi.fn()}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Add note tag' });
    fireEvent.change(input, { target: { value: 'networking' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ tags: ['networking'] }));
  });

  it('keeps only the note summary and expand control when secondary context is collapsed', () => {
    const note = {
      ...createLocalNote({ id: 'note-1', title: 'TCP', folderId: null, now: 1 }),
      content: 'abc',
      tags: ['networking'],
    };
    const chat = createChatReference({ id: 'chat-1', label: 'TCP discussion', target: 'https://chatgpt.com/c/tcp', folderId: null, now: 1 });
    const onToggleContext = vi.fn();

    render(
      <LocalNoteEditor
        note={note}
        chats={[chat]}
        contextExpanded={false}
        onChange={vi.fn()}
        onLinkChat={vi.fn()}
        onToggleContext={onToggleContext}
      />,
    );

    expect(screen.getByText('3 chars · 1 tags')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Link chat' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand note context' }));
    expect(onToggleContext).toHaveBeenCalledOnce();
  });
});
