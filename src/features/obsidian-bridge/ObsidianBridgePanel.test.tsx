import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ObsidianBridgePanel } from './ObsidianBridgePanel';

afterEach(() => cleanup());

describe('ObsidianBridgePanel', () => {
  it('requires a token and passes it only through the explicit connect action', async () => {
    const onConnect = vi.fn().mockResolvedValue(undefined);
    render(
      <ObsidianBridgePanel
        state="disconnected"
        message={null}
        onConnect={onConnect}
        onDisconnect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect bridge' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Bridge token is required.');
    expect(onConnect).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Bridge token'), { target: { value: '  token-123  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect bridge' }));
    await waitFor(() => expect(onConnect).toHaveBeenCalledWith('token-123'));
  });
});
