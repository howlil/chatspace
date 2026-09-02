import { describe, expect, it, vi } from 'vitest';

import { createChatReference, createLocalNote } from './model';
import { artifactMatchesFilter, matchesWorkspaceQuery, rankRetrievalItems } from './retrieval';

describe('workspace retrieval', () => {
  it('keeps archived artifacts out of normal filters and exposes them explicitly', () => {
    const chat = createChatReference({ id: 'chat-1', label: 'Architecture', target: 'https://chatgpt.com/c/1', folderId: null, now: 1 });
    const archived = { ...chat, archivedAt: 5 };

    expect(artifactMatchesFilter(chat, 'chat', 'all')).toBe(true);
    expect(artifactMatchesFilter(archived, 'chat', 'all')).toBe(false);
    expect(artifactMatchesFilter(archived, 'chat', 'archived')).toBe(true);
    expect(artifactMatchesFilter(chat, 'chat', 'unfiled')).toBe(true);
  });

  it('searches user-authored note title, tags, and Markdown without provider content', () => {
    const note = {
      ...createLocalNote({ id: 'note-1', title: 'Storage recovery', folderId: null, now: 1 }),
      tags: ['persistence'],
      content: 'Fail closed when local state is corrupt.',
    };
    expect(matchesWorkspaceQuery(note, 'note', 'persistence')).toBe(true);
    expect(matchesWorkspaceQuery(note, 'note', 'fail closed')).toBe(true);
    expect(matchesWorkspaceQuery(note, 'note', 'missing')).toBe(false);
  });

  it('ranks exact and prefix artifact matches before content matches and commands', () => {
    const run = vi.fn();
    const ranked = rankRetrievalItems([
      { id: 'command', kind: 'command', label: 'Open graph', searchText: 'Open graph', run },
      { id: 'content', kind: 'note', label: 'Recovery notes', searchText: 'architecture discussion', run },
      { id: 'prefix', kind: 'chat', label: 'Architecture review', searchText: 'Architecture review', run },
      { id: 'exact', kind: 'folder', label: 'Architecture', searchText: 'Architecture', run },
    ], 'architecture');

    expect(ranked.map((item) => item.id)).toEqual(['exact', 'prefix', 'content']);
  });
});
