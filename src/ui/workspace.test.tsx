import { fireEvent, render, screen } from '@testing-library/react';
import { Database } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { InlineFeedback, SearchField, WorkspaceHeader } from './workspace';

describe('workspace UI grammar', () => {
  it('renders a shared workspace header with accessible heading content', () => {
    render(<WorkspaceHeader icon={Database} title="Local workspace" description="Extension-owned storage." />);
    expect(screen.getByRole('heading', { name: 'Local workspace' })).toBeInTheDocument();
    expect(screen.getByText('Extension-owned storage.')).toBeInTheDocument();
  });

  it('uses alert semantics only for danger feedback', () => {
    const { rerender } = render(<InlineFeedback>Workspace ready.</InlineFeedback>);
    expect(screen.getByRole('status')).toHaveTextContent('Workspace ready.');
    rerender(<InlineFeedback tone="danger">Storage failed.</InlineFeedback>);
    expect(screen.getByRole('alert')).toHaveTextContent('Storage failed.');
  });

  it('forwards search text through the shared field contract', () => {
    const onValueChange = vi.fn();
    render(
      <SearchField
        aria-label="Search workspace"
        placeholder="Search workspace"
        value=""
        onValueChange={onValueChange}
      />,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Search workspace' }), { target: { value: 'notes' } });
    expect(onValueChange).toHaveBeenCalledWith('notes');
  });
});
