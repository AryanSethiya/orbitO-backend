import { describe, it, expect } from 'vitest';
import { computeDeterministicRanks, VocabularyItemForRanking } from '../../../src/core/services/ranking-engine.js';
import { normalizeVector } from '../../../src/core/services/vector-math.js';

describe('Domain: Deterministic Ranking Engine', () => {
  const targetEmbedding = normalizeVector([1, 0, 0, 0]);

  const mockVocab: VocabularyItemForRanking[] = [
    {
      id: '1',
      word: 'airport',
      normalizedWord: 'airport',
      embedding: normalizeVector([1, 0, 0, 0]), // identical (similarity 1.0)
    },
    {
      id: '2',
      word: 'terminal',
      normalizedWord: 'terminal',
      embedding: normalizeVector([0.9, 0.1, 0, 0]), // high similarity
    },
    {
      id: '3',
      word: 'runway',
      normalizedWord: 'runway',
      embedding: normalizeVector([0.8, 0.2, 0, 0]), // medium-high similarity
    },
    {
      id: '4',
      word: 'banana',
      normalizedWord: 'banana',
      embedding: normalizeVector([0.1, 0.9, 0, 0]), // low similarity
    },
  ];

  it('should assign Rank #1 to the target word', () => {
    const ranks = computeDeterministicRanks(targetEmbedding, mockVocab, 'airport');
    expect(ranks[0].normalizedWord).toBe('airport');
    expect(ranks[0].rank).toBe(1);
    expect(ranks[0].semanticScore).toBe(1.0);
  });

  it('should assign contiguous ranks 1..N with correct ordering', () => {
    const ranks = computeDeterministicRanks(targetEmbedding, mockVocab, 'airport');
    expect(ranks).toHaveLength(4);
    expect(ranks.map((r) => r.rank)).toEqual([1, 2, 3, 4]);

    // airport (#1) -> terminal (#2) -> runway (#3) -> banana (#4)
    expect(ranks.map((r) => r.normalizedWord)).toEqual([
      'airport',
      'terminal',
      'runway',
      'banana',
    ]);
  });

  it('should resolve identical similarities using alphabetical tie-breaker', () => {
    const tiedVocab: VocabularyItemForRanking[] = [
      {
        id: '1',
        word: 'zebra',
        normalizedWord: 'zebra',
        embedding: [0.5, 0.5, 0, 0],
      },
      {
        id: '2',
        word: 'apple',
        normalizedWord: 'apple',
        embedding: [0.5, 0.5, 0, 0],
      },
    ];

    const ranks = computeDeterministicRanks([0.5, 0.5, 0, 0], tiedVocab);
    // Both have exact same similarity, so 'apple' must come before 'zebra'
    expect(ranks[0].normalizedWord).toBe('apple');
    expect(ranks[0].rank).toBe(1);
    expect(ranks[1].normalizedWord).toBe('zebra');
    expect(ranks[1].rank).toBe(2);
  });

  it('should return empty array for empty vocabulary', () => {
    expect(computeDeterministicRanks(targetEmbedding, [])).toEqual([]);
  });
});
