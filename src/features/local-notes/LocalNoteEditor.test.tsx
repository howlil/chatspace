import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createChatReference, createLocalNote } from '../../domain/workspace/model';
import { LocalNoteEditor } from './LocalNoteEditor';

describe('LocalNoteEditor', () => {
  it('edits Markdown and explicitly links a local chat reference', () => {
    const note = createLocalNote({ id: 'note-1', title: 'TCP', folderId: null, now: 1 });
    const chat = createChatReference({
      id: 'chat-1',
      label: 'TCP discussion',
      target: 'https://chatgpt.com/c/tcp',
      folderId: null,
      now: 1,
    });
    const onChange = vi.fn();
    const onLinkChat = vi.fn();

    render(<LocalNoteEditor note={note} chats={[chat]} onChange={onChange} onLinkChat={onLinkChat} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Markdown content' }), {
      target: { value: '# TCP\nReliable byte stream' },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ content: '# TCP\nReliable byte stream' }));

    fireEvent.click(screen.getByRole('button', { name: 'Link chat' }));
    expect(onLinkChat).toHaveBeenCalledWith('chat-1');
  });
});
