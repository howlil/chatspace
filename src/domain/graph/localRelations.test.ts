import { describe, expect, it } from 'vitest';

import { createLocalNote, type LocalNote } from '../workspace/model';
import { deriveLocalNoteRelations } from './localRelations';

function note(id: string, title: string, content: string, tags: string[] = []): LocalNote {
  return { ...createLocalNote({ id, title, folderId: null, now: 1 }), content, tags };
}

describe('deriveLocalNoteRelations', () => {
  it('derives deterministic explainable relationships from local note text', () => {
    const notes = [
      note('a', 'Postgres transactions', 'MVCC isolation locking production behavior'),
      note('b', 'MVCC isolation', 'Postgres transactions and locking tradeoffs'),
      note('c', 'TCP congestion', 'packet retransmission window throughput'),
    ];

    const first = deriveLocalNoteRelations(notes);
    const second = deriveLocalNoteRelations([...notes].reverse());

    expect(first).toEqual(second);
    expect(first).toHaveLength(1);
    expect(first[0]).toEqual(
      expect.objectContaining({
        sourceNoteId: 'a',
        targetNoteId: 'b',
        sharedTerms: expect.arrayContaining(['postgres', 'transactions', 'mvcc', 'isolation', 'locking']),
      }),
    );
  });

  it('does not invent a relationship for unrelated sparse notes', () => {
    expect(
      deriveLocalNoteRelations([
        note('a', 'Redis', 'cache ttl eviction'),
        note('b', 'Kubernetes', 'scheduler pod affinity'),
      ]),
    ).toEqual([]);
  });

  it('uses an explicit shared tag as local evidence', () => {
    const relations = deriveLocalNoteRelations([
      note('a', 'Atomicity', 'commit rollback', ['database']),
      note('b', 'Indexing', 'btree planner', ['database']),
    ]);
    expect(relations).toHaveLength(1);
  });
});
