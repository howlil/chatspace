import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsPanel } from './SettingsPanel';

afterEach(() => cleanup());

describe('SettingsPanel', () => {
  it('surfaces invalid imports without replacing current data', async () => {
    const onImport = vi.fn().mockRejectedValue(new Error('Invalid workspace JSON.'));
    render(<SettingsPanel exportJson="{}" recoveryJson={null} persistenceError={null} onImport={onImport} onReset={vi.fn()} onDownload={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox', { name:'Workspace import' }), { target:{ value:'not-json' } });
    fireEvent.click(screen.getByRole('button', { name:'Import backup' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid workspace JSON.');
  });

  it('requires an explicit second action before reset', async () => {
    const onReset = vi.fn().mockResolvedValue(undefined);
    render(<SettingsPanel exportJson="{}" recoveryJson={null} persistenceError={null} onImport={vi.fn()} onReset={onReset} onDownload={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name:'Reset local data' }));
    expect(onReset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name:'Confirm reset' }));
    await waitFor(() => expect(onReset).toHaveBeenCalledOnce());
  });

  it('keeps a corrupted raw payload available for recovery download', () => {
    const onDownload = vi.fn();
    render(<SettingsPanel exportJson="{}" recoveryJson="{\"broken\":true}" persistenceError="Storage recovery required." onImport={vi.fn()} onReset={vi.fn()} onDownload={onDownload} />);
    expect(screen.getByRole('textbox', { name:'Raw recovery payload' })).toHaveValue('{"broken":true}');
    fireEvent.click(screen.getByRole('button', { name:'Download recovery' }));
    expect(onDownload).toHaveBeenCalledWith('chatspace-recovery.json','{"broken":true}');
  });
});
