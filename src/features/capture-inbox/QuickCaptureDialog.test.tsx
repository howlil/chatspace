import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QuickCaptureDialog } from './QuickCaptureDialog';

afterEach(() => cleanup());

describe('QuickCaptureDialog', () => {
  it('saves with Enter and keeps Shift+Enter as a newline', () => {
    const onSave = vi.fn();
    render(<QuickCaptureDialog open linkedChatLabel={null} onSave={onSave} onClose={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: 'Quick capture' });
    fireEvent.change(input, { target: { value: 'First line' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'First line\nSecond line' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith('First line\nSecond line');
  });

  it('does not save empty content and closes through Escape', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<QuickCaptureDialog open linkedChatLabel="Saved chat" onSave={onSave} onClose={onClose} />);

    const input = screen.getByRole('textbox', { name: 'Quick capture' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});