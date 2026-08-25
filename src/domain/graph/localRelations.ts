import type { LocalNote } from '../workspace/model';

const STOP_WORDS = new Set([
  'about', 'after', 'also', 'and', 'atau', 'dalam', 'dari', 'dengan', 'for', 'from', 'how',
  'ini', 'into', 'itu', 'karena', 'ketika', 'lebih', 'pada', 'the', 'this', 'untuk', 'yang',
]);
const MAX_RELATIONS_PER_NOTE = 3;

export interface LocalNoteRelation {
  sourceNoteId: string;
  targetNoteId: string;
  score: number;
  sharedTerms: string[];
}

function normalizeTerm(value: string): string {
  return value.toLocaleLowerCase().replace(/^[-_]+|[-_]+$/g, '');
}

function termsFor(note: LocalNote): Set<string> {
  const source = `${note.title}\n${note.tags.join(' ')}\n${note.content}`.toLocaleLowerCase();
  const tokens = source.match(/[a-z0-9][a-z0-9_-]{2,}/g) ?? [];
  return new Set(
    tokens
      .map(normalizeTerm)
      .filter((term) => term.length >= 3 && !STOP_WORDS.has(term)),
  );
}

function normalizedTags(note: LocalNote): Set<string> {
  return new Set(note.tags.map(normalizeTerm).filter((tag) => tag.length >= 2));
}

function intersection(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((term) => right.has(term)).sort();
}

function pairKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort().join('::');
}

export function localRelationPairKey(leftId: string, rightId: string): string {
  return pairKey(leftId, rightId);
}

export function deriveLocalNoteRelations(notes: LocalNote[]): LocalNoteRelation[] {
  const prepared = notes.map((note) => ({ note, terms: termsFor(note), tags: normalizedTags(note) }));
  const candidates: LocalNoteRelation[] = [];

  for (let leftIndex = 0; leftIndex < prepared.length; leftIndex += 1) {
    const left = prepared[leftIndex];
    if (left === undefined) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < prepared.length; rightIndex += 1) {
      const right = prepared[rightIndex];
      if (right === undefined) continue;
      const sharedTerms = intersection(left.terms, right.terms);
      const sharedTags = intersection(left.tags, right.tags);
      if (sharedTerms.length < 2 && sharedTags.length === 0) continue;
      const denominator = Math.max(1, Math.min(left.terms.size, right.terms.size));
      const lexicalScore = sharedTerms.length / denominator;
      const score = Math.min(1, lexicalScore + (sharedTags.length > 0 ? 0.25 : 0));
      if (score < 0.18) continue;

      const [sourceNoteId, targetNoteId] = [left.note.id, right.note.id].sort();
      candidates.push({
        sourceNoteId: sourceNoteId ?? left.note.id,
        targetNoteId: targetNoteId ?? right.note.id,
        score,
        sharedTerms,
      });
    }
  }

  candidates.sort(
    (left, right) =>
      right.score - left.score ||
      pairKey(left.sourceNoteId, left.targetNoteId).localeCompare(
        pairKey(right.sourceNoteId, right.targetNoteId),
      ),
  );

  const degree = new Map<string, number>();
  const accepted: LocalNoteRelation[] = [];
  for (const candidate of candidates) {
    const sourceDegree = degree.get(candidate.sourceNoteId) ?? 0;
    const targetDegree = degree.get(candidate.targetNoteId) ?? 0;
    if (sourceDegree >= MAX_RELATIONS_PER_NOTE || targetDegree >= MAX_RELATIONS_PER_NOTE) continue;
    accepted.push(candidate);
    degree.set(candidate.sourceNoteId, sourceDegree + 1);
    degree.set(candidate.targetNoteId, targetDegree + 1);
  }

  return accepted.sort((left, right) =>
    pairKey(left.sourceNoteId, left.targetNoteId).localeCompare(
      pairKey(right.sourceNoteId, right.targetNoteId),
    ),
  );
}
