import { describe, expect, it } from 'vitest';

import { createLocalNote } from '../workspace/model';
import {
  deriveBacklinks,
  deriveOutgoingNoteIds,
  findActiveWikilinkQuery,
  parseNoteLinks,
  resolveNoteLinks,
} from './noteLinks';

function note(id: string, title: string, content = '') {
  return { ...createLocalNote({ id, title, folderId: null, now: 1 }), content };
}

describe('note wikilinks', () => {
  it('parses multiple wikilinks while ignoring fenced code', () => {
    const content = 'See [[Storage recovery]] and [[Graph semantics]].\n```md\n[[Ignored code]]\n```\n[[Local first]]';
    expect(parseNoteLinks(content).map((link) => link.title)).toEqual([
      'Storage recovery',
      'Graph semantics',
      'Local first',
    ]);
  });

  it('resolves unique titles and surfaces unresolved and ambiguous links', () => {
    const source = note('source', 'Source', '[[Unique]] [[Missing]] [[Duplicate]]');
    const notes = [source, note('one', 'Unique'), note('dup-a', 'Duplicate'), note('dup-b', ' duplicate ')];
    const links = resolveNoteLinks(source, notes);

    expect(links.map((link) => [link.token.title, link.status, link.targetNoteId])).toEqual([
      ['Unique', 'resolved', 'one'],
      ['Missing', 'unresolved', null],
      ['Duplicate', 'ambiguous', null],
    ]);
  });

  it('derives unique outgoing links and backlinks from Markdown only', () => {
    const target = note('target', 'Storage recovery');
    const source = note('source', 'Architecture', 'Use [[Storage recovery]] then revisit [[Storage recovery]].');
    const other = note('other', 'Operations', 'Related to [[Storage recovery]].');
    const notes = [source, target, other];

    expect(deriveOutgoingNoteIds(source, notes)).toEqual(['target']);
    expect(deriveBacklinks(target.id, notes).map((backlink) => backlink.sourceNoteId)).toEqual(['source', 'source', 'other']);
  });

  it('finds only an unfinished wikilink at the current caret', () => {
    expect(findActiveWikilinkQuery('See [[Stor', 10)).toEqual({ start: 4, end: 10, query: 'Stor' });
    expect(findActiveWikilinkQuery('See [[Storage]]', 15)).toBeNull();
    expect(findActiveWikilinkQuery('[[One\nTwo', 9)).toBeNull();
  });
});
