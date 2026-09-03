import { describe, expect, it } from 'vitest';

import { createLocalNote } from '../workspace/model';
import {
  deriveBacklinks,
  deriveOutgoingNoteIds,
  diagnoseNoteLinks,
  findActiveWikilinkQuery,
  parseNoteLinks,
  replaceNoteLinkToken,
  resolveNoteLinks,
  rewriteInboundLinksForRename,
} from './noteLinks';

function note(id: string, title: string, content = '') {
  return { ...createLocalNote({ id, title, folderId: null, now: 1 }), content };
}

describe('note wikilinks', () => {
  it('parses aliases while ignoring fenced code', () => {
    const content = 'See [[Storage recovery|recovery]] and [[Graph semantics]].\n```md\n[[Ignored code]]\n```\n[[Local first]]';
    expect(parseNoteLinks(content).map((link) => [link.title, link.alias])).toEqual([
      ['Storage recovery', 'recovery'],
      ['Graph semantics', null],
      ['Local first', null],
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
    expect(diagnoseNoteLinks(source, notes)).toEqual({ resolved: 1, unresolved: 1, ambiguous: 1 });
  });

  it('derives unique outgoing links and backlinks from Markdown only', () => {
    const target = note('target', 'Storage recovery');
    const source = note('source', 'Architecture', 'Use [[Storage recovery]] then revisit [[Storage recovery]].');
    const other = note('other', 'Operations', 'Related to [[Storage recovery]].');
    const notes = [source, target, other];

    expect(deriveOutgoingNoteIds(source, notes)).toEqual(['target']);
    expect(deriveBacklinks(target.id, notes).map((backlink) => backlink.sourceNoteId)).toEqual(['source', 'source', 'other']);
  });

  it('rewrites only inbound links that uniquely resolved before rename and preserves aliases', () => {
    const target = note('target', 'Persistence model');
    const source = note('source', 'Architecture', 'Use [[Persistence model]] and [[Persistence model|storage]].\n```md\n[[Persistence model]]\n```');
    const unresolved = note('unresolved', 'Other', 'Keep [[Missing]].');
    const renamed = rewriteInboundLinksForRename([source, target, unresolved], target.id, 'Storage model', 9);

    expect(renamed.find((item) => item.id === 'target')?.title).toBe('Storage model');
    expect(renamed.find((item) => item.id === 'source')?.content).toBe('Use [[Storage model]] and [[Storage model|storage]].\n```md\n[[Persistence model]]\n```');
    expect(renamed.find((item) => item.id === 'unresolved')?.content).toBe('Keep [[Missing]].');
    expect(deriveBacklinks('target', renamed).map((item) => item.sourceNoteId)).toEqual(['source', 'source']);
  });

  it('does not rewrite an ambiguous title during rename', () => {
    const source = note('source', 'Source', '[[TCP]]');
    const target = note('target', 'TCP');
    const duplicate = note('duplicate', ' tcp ');
    const renamed = rewriteInboundLinksForRename([source, target, duplicate], target.id, 'Transport', 2);
    expect(renamed.find((item) => item.id === 'source')?.content).toBe('[[TCP]]');
    expect(renamed.find((item) => item.id === 'target')?.title).toBe('Transport');
  });

  it('replaces one broken token without affecting surrounding Markdown', () => {
    const source = note('source', 'Source', 'Before [[Missing|label]] after');
    const token = parseNoteLinks(source.content)[0];
    expect(token).toBeDefined();
    expect(replaceNoteLinkToken(source.content, token!, 'Existing')).toBe('Before [[Existing|label]] after');
  });

  it('finds only an unfinished wikilink target at the current caret', () => {
    expect(findActiveWikilinkQuery('See [[Stor', 10)).toEqual({ start: 4, end: 10, query: 'Stor' });
    expect(findActiveWikilinkQuery('See [[Storage|label', 19)).toEqual({ start: 4, end: 19, query: 'Storage' });
    expect(findActiveWikilinkQuery('See [[Storage]]', 15)).toBeNull();
    expect(findActiveWikilinkQuery('[[One\nTwo', 9)).toBeNull();
  });
});
