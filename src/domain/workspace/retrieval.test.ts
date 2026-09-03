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

  it('searches user-authored note and chat context without provider content', () => {
    const note = {
      ...createLocalNote({ id: 'note-1', title: 'Storage recovery', folderId: null, now: 1 }),
      tags: ['persistence'],
      content: 'Fail closed when local state is corrupt.',
    };
    const chat = createChatReference({
      id: 'chat-1',
      label: 'Database discussion',
      annotation: 'Clear explanation of write skew',
      target: 'https://chatgpt.com/c/1',
      folderId: null,
      now: 1,
    });

    expect(matchesWorkspaceQuery(note, 'note', 'persistence')).toBe(true);
    expect(matchesWorkspaceQuery(note, 'note', 'fail closed')).toBe(true);
    expect(matchesWorkspaceQuery(chat, 'chat', 'write skew')).toBe(true);
    expect(matchesWorkspaceQuery(chat, 'chat', 'missing')).toBe(false);
  });

  it('ranks exact and prefix title matches before context and content matches', () => {
    const run = vi.fn();
    const ranked = rankRetrievalItems([
      { id: 'content', kind: 'note', label: 'Recovery notes', searchText: 'Recovery notes', contentText: 'architecture discussion', run },
      { id: 'context', kind: 'chat', label: 'Design review', searchText: 'Design review', contextText: 'architecture decision', run },
      { id: 'prefix', kind: 'chat', label: 'Architecture review', searchText: 'Architecture review', run },
      { id: 'exact', kind: 'folder', label: 'Architecture', searchText: 'Architecture', run },
    ], 'architecture');

    expect(ranked.map((item) => item.id)).toEqual(['exact', 'prefix', 'context', 'content']);
  });

  it('uses pin and recency only as deterministic tie-break signals at the same relevance level', () => {
    const run = vi.fn();
    const ranked = rankRetrievalItems([
      { id: 'old', kind: 'chat', label: 'Old item', searchText: 'Old item', contextText: 'postgres', updatedAt: 10, run },
      { id: 'recent', kind: 'note', label: 'Recent item', searchText: 'Recent item', contextText: 'postgres', updatedAt: 30, run },
      { id: 'pinned', kind: 'chat', label: 'Pinned item', searchText: 'Pinned item', contextText: 'postgres', pinned: true, updatedAt: 5, run },
    ], 'postgres');

    expect(ranked.map((item) => item.id)).toEqual(['pinned', 'recent', 'old']);
  });

  it('shows recent and pinned work before commands and secondary containers when the query is empty', () => {
    const run = vi.fn();
    const ranked = rankRetrievalItems([
      { id: 'folder', kind: 'folder', label: 'Backend', searchText: 'Backend', run },
      { id: 'command', kind: 'command', label: 'Quick capture to Inbox', searchText: 'Quick capture to Inbox', priority: 0, run },
      { id: 'old-note', kind: 'note', label: 'Old note', searchText: 'Old note', updatedAt: 1, run },
      { id: 'recent-note', kind: 'note', label: 'Recent note', searchText: 'Recent note', updatedAt: 20, run },
      { id: 'pinned-chat', kind: 'chat', label: 'Pinned chat', searchText: 'Pinned chat', pinned: true, updatedAt: 2, run },
    ], '');

    expect(ranked.map((item) => item.id)).toEqual(['pinned-chat', 'recent-note', 'old-note', 'command', 'folder']);
  });
});
