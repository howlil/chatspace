import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { normalizeConversationSnapshot } from '../../domain/conversation/normalize';
import { projectConversationGraph } from '../../domain/conversation/projection';
import { ConversationGraph } from './ConversationGraph';

function fixture() {
  const snapshot = normalizeConversationSnapshot({
    conversationId: 'abc',
    target: 'https://chatgpt.com/c/abc',
    messages: [
      { role: 'user', text: 'Database schema', providerId: 'u1' },
      { role: 'assistant', text: 'Postgres', providerId: 'a1' },
      { role: 'user', text: 'Redis caching', providerId: 'u2' },
      { role: 'assistant', text: 'Use Redis', providerId: 'a2' },
    ],
  });
  return { snapshot, graph: projectConversationGraph(snapshot) };
}

describe('ConversationGraph', () => {
  it('selects a turn, focuses its inspector, and switches to the synchronized outline', () => {
    const { snapshot, graph } = fixture();
    render(<ConversationGraph snapshot={snapshot} graph={graph} annotations={[]} activeSourceId={null} onGoToSource={() => undefined} onUpdateAnnotation={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'turn Redis caching' }));
    expect(screen.getByText('Selected turn')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Go to source' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Outline' }));
    expect(screen.getByLabelText('Conversation outline')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Redis caching' })).toBeVisible();
  });
});
