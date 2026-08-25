import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLocalNote } from '../../domain/workspace/model';
import { RelatedNotesPanel } from './RelatedNotesPanel';

afterEach(() => cleanup());

describe('RelatedNotesPanel', () => {
  it('shows explainable local evidence and opens the related note', () => {
    const first = createLocalNote({ id: 'a', title: 'Postgres MVCC', folderId: null, now: 1 });
    first.content = 'transactions isolation locking';
    const second = createLocalNote({ id: 'b', title: 'MVCC isolation', folderId: null, now: 1 });
    second.content = 'postgres transactions locking';
    const onOpenNote = vi.fn();

    render(<RelatedNotesPanel noteId="a" notes={[first, second]} onOpenNote={onOpenNote} />);

    expect(screen.getByText(/transactions/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /MVCC isolation/ }));
    expect(onOpenNote).toHaveBeenCalledWith(second);
  });
});
