import { describe, expect, it } from 'vitest';

import { createFolder, createInitialWorkspace, createLocalNote } from './model';
import {
  applyMarkdownImport,
  scanMarkdownImport,
  type MarkdownImportDecision,
} from './markdownImport';

describe('Markdown import', () => {
  it('scans folders, YAML frontmatter, tags, body, wikilinks, structured properties, and Chatspace IDs without mutating workspace', () => {
    const workspace = createInitialWorkspace(10);
    const before = JSON.stringify(workspace);
    const scan = scanMarkdownImport(workspace, [
      {
        path: 'Backend/TCP.md',
        content: '---\ntitle: TCP\ntags:\n  - networking\n  - backend\nproperties: {"status":"research","score":2,"reviewed":false,"labels":["transport"],"due":{"type":"date","value":"2026-09-30"}}\nchatspace_id: note-tcp\n---\n# TCP\nSee [[MVCC]].',
      },
      {
        path: 'Database/MVCC.md',
        content: '---\ntitle: "MVCC"\ntags: [database, postgres]\n---\nMVCC body',
      },
      {
        path: 'chat-references/Conversation.md',
        content: '---\nchatspace_type: chat-reference\nchatspace_id: chat-one\n---\n# Conversation',
      },
    ], 'Vault');

    expect(JSON.stringify(workspace)).toBe(before);
    expect(scan.rootName).toBe('Vault');
    expect(scan.notes).toHaveLength(2);
    expect(scan.folderCount).toBe(2);
    expect(scan.resolvedLinks).toBe(1);
    expect(scan.unresolvedLinks).toBe(0);
    expect(scan.notes[0]).toMatchObject({
      title: 'TCP',
      tags: ['networking', 'backend'],
      properties: {
        status: 'research',
        score: 2,
        reviewed: false,
        labels: ['transport'],
        due: { type: 'date', value: '2026-09-30' },
      },
      folderPath: ['Backend'],
      requestedNoteId: 'note-tcp',
      wikilinks: ['MVCC'],
    });
    expect(scan.warnings[0]).toContain('skipped Chatspace chat-reference');
  });

  it('recognizes exported Chatspace note paths and keeps authored Markdown body and properties stable', () => {
    const workspace = createInitialWorkspace(10);
    const scan = scanMarkdownImport(workspace, [{
      path: 'notes/Backend--folder-backend/TCP--note-tcp.md',
      content: '---\nchatspace_type: "note"\nchatspace_id: "note-tcp"\ntitle: "TCP"\ntags: ["networking"]\nproperties: {"status":"active","started":{"type":"date","value":"2026-09-03"}}\n---\n\nOriginal body with [[UDP]].',
    }]);

    expect(scan.notes[0]).toMatchObject({
      title: 'TCP',
      folderPath: ['Backend'],
      requestedNoteId: 'note-tcp',
      tags: ['networking'],
      properties: { status: 'active', started: { type: 'date', value: '2026-09-03' } },
      content: '\nOriginal body with [[UDP]].',
    });
  });

  it('rejects unsupported structured property shapes instead of silently losing them', () => {
    const workspace = createInitialWorkspace(10);
    expect(() => scanMarkdownImport(workspace, [{
      path: 'Bad.md',
      content: '---\nproperties: {"nested":{"unexpected":true}}\n---\nBad',
    }])).toThrow(/Unsupported structured property value/);
  });

  it('requires explicit decisions for ID and title conflicts, then applies them as one snapshot transition', () => {
    const workspace = createInitialWorkspace(10);
    const backend = createFolder({ id: 'folder-backend', name: 'Backend', parentId: null, now: 2 });
    const tcp = {
      ...createLocalNote({ id: 'note-tcp', title: 'TCP', folderId: backend.id, now: 3 }),
      content: 'Old TCP',
      tags: ['old'],
      properties: { status: 'old' },
    };
    const architecture = {
      ...createLocalNote({ id: 'note-architecture', title: 'Architecture', folderId: null, now: 4 }),
      content: 'Read [[TCP]].',
    };
    const retries = createLocalNote({ id: 'note-retries', title: 'Retries', folderId: null, now: 5 });
    workspace.folders.push(backend);
    workspace.notes.push(tcp, architecture, retries);
    workspace.updatedAt = 10;

    const scan = scanMarkdownImport(workspace, [
      {
        path: 'Networking/Transport.md',
        content: '---\nchatspace_id: note-tcp\ntitle: Transport\ntags: [networking]\nproperties: {"status":"research","priority":3}\n---\nUpdated transport body',
      },
      {
        path: 'Patterns/Retries.md',
        content: '---\ntitle: Retries\nproperties: {"topic":"reliability"}\n---\nIncoming retry body',
      },
    ]);

    expect(scan.conflicts.map((conflict) => conflict.kind)).toEqual(['id-match', 'title-match']);
    expect(() => applyMarkdownImport(workspace, scan, [], 20, (prefix) => `${prefix}-generated`)).toThrow(/Resolve the conflict/);
    expect(workspace.notes.find((note) => note.id === 'note-tcp')?.title).toBe('TCP');

    const decisions: MarkdownImportDecision[] = [
      { sourcePath: 'Networking/Transport.md', action: 'update-existing', renameTo: null },
      { sourcePath: 'Patterns/Retries.md', action: 'rename-incoming', renameTo: 'Retry patterns' },
    ];
    let counter = 0;
    const result = applyMarkdownImport(workspace, scan, decisions, 20, (prefix) => `${prefix}-generated-${counter++}`);

    expect(result.updated).toBe(1);
    expect(result.imported).toBe(1);
    expect(result.snapshot.notes.find((note) => note.id === 'note-tcp')).toMatchObject({
      title: 'Transport',
      content: 'Updated transport body',
      tags: ['networking'],
      properties: { status: 'research', priority: 3 },
    });
    expect(result.snapshot.notes.find((note) => note.id === 'note-architecture')?.content).toBe('Read [[Transport]].');
    expect(result.snapshot.notes.find((note) => note.title === 'Retry patterns')?.properties).toEqual({ topic: 'reliability' });
    expect(result.snapshot.folders.some((folder) => folder.name === 'Networking')).toBe(true);
    expect(result.snapshot.folders.some((folder) => folder.name === 'Patterns')).toBe(true);
    expect(workspace.notes.find((note) => note.id === 'note-tcp')?.title).toBe('TCP');
  });

  it('rejects a stale scan so parsing and review can never overwrite later workspace changes', () => {
    const workspace = createInitialWorkspace(10);
    const scan = scanMarkdownImport(workspace, [{ path: 'One.md', content: '# One' }]);
    const changed = { ...workspace, updatedAt: 11 };
    expect(() => applyMarkdownImport(changed, scan, [], 12)).toThrow(/Workspace changed after the Markdown scan/);
  });
});