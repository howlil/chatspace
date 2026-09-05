import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WorkspaceTree } from './WorkspaceTree';

describe('WorkspaceTree M20 navigation semantics', () => {
  it('uses library-root language instead of a second Home semantic', () => {
    render(
      <WorkspaceTree
        folders={[]}
        chatRefs={[]}
        notes={[]}
        selectedFolderId={null}
        onSelectFolder={vi.fn()}
        onToggleFolder={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateNote={vi.fn()}
        onRenameFolder={vi.fn()}
        onDeleteFolder={vi.fn()}
        onMoveFolder={vi.fn()}
        onOpenChat={vi.fn()}
        onOpenNote={vi.fn()}
        onTogglePinChat={vi.fn()}
        onRenameChat={vi.fn()}
        onDeleteChat={vi.fn()}
        onRenameNote={vi.fn()}
        onDeleteNote={vi.fn()}
        onMoveChat={vi.fn()}
        onMoveNote={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'All items' })).toBeVisible();
    expect(screen.queryByText('Workspace root')).not.toBeInTheDocument();
  });
});
