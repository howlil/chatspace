import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { exportWorkspaceJson, importWorkspaceJson } from '../../domain/workspace/io';
import { scanMarkdownImport } from '../../domain/workspace/markdownImport';
import { createInitialWorkspace } from '../../domain/workspace/model';
import { SettingsPanel } from './SettingsPanel';

afterEach(() => cleanup());

describe('SettingsPanel Markdown round-trip', () => {
  it('scans first, previews without mutation, then imports through one canonical workspace replacement', async () => {
    const snapshot = createInitialWorkspace(5);
    const exportJson = exportWorkspaceJson(snapshot);
    const scan = scanMarkdownImport(snapshot, [{
      path: 'Backend/TCP.md',
      content: '---\ntitle: TCP\ntags: [networking]\n---\nReliable stream',
    }], 'Knowledge');
    const onMarkdownScan = vi.fn().mockResolvedValue(scan);
    const onImport = vi.fn().mockResolvedValue(undefined);

    render(
      <SettingsPanel
        exportJson={exportJson}
        recoveryJson={null}
        persistenceError={null}
        onImport={onImport}
        onReset={vi.fn()}
        onDownload={vi.fn()}
        onMarkdownScan={onMarkdownScan}
        markdownImportSupported
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Import Markdown folder' }));
    await waitFor(() => expect(onMarkdownScan).toHaveBeenCalledWith(exportJson));
    expect(await screen.findByLabelText('Markdown import preview')).toBeVisible();
    expect(screen.getByText('Knowledge')).toBeVisible();
    expect(onImport).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Import 1 note' }));
    await waitFor(() => expect(onImport).toHaveBeenCalledOnce());
    const imported = importWorkspaceJson(onImport.mock.calls[0]?.[0] as string);
    expect(imported.notes).toHaveLength(1);
    expect(imported.notes[0]).toMatchObject({ title: 'TCP', tags: ['networking'], content: 'Reliable stream' });
    expect(imported.folders.some((folder) => folder.name === 'Backend')).toBe(true);
  });
});