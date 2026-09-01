import { describe, expect, it } from 'vitest';

import { noteFilename, safeVaultSegment } from './filename';

describe('local vault filenames', () => {
  it('sanitizes path-breaking and reserved characters', () => {
    expect(safeVaultSegment('A:B/C\\D*?', 'fallback')).toBe('A-B-C-D--');
  });

  it('uses deterministic fallbacks and stable note filenames', () => {
    expect(safeVaultSegment('...', 'fallback')).toBe('fallback');
    expect(noteFilename('   ', '...')).toBe('Untitled-note.md');
    expect(noteFilename('Transactions', 'note-1')).toBe('Transactions-note-1.md');
  });
});
