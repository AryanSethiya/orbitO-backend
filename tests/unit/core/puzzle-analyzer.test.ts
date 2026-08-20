import { describe, it, expect } from 'vitest';
import { analyzePuzzleDifficulty } from '../../../src/core/services/puzzle-analyzer.js';
import { RankedWordResult } from '../../../src/core/services/ranking-engine.js';

describe('Domain: Puzzle Analyzer', () => {
  it('should categorize dense neighborhoods as easy', () => {
    const denseRanks: RankedWordResult[] = Array.from({ length: 50 }, (_, i) => ({
      wordId: `id-${i}`,
      word: `word-${i}`,
      normalizedWord: `word-${i}`,
      semanticScore: 1.0 - i * 0.002, // Top 10 will have avg ~0.99
      rank: i + 1,
    }));

    const result = analyzePuzzleDifficulty(denseRanks);
    expect(result.difficulty).toBe('easy');
    expect(result.top10AverageSimilarity).toBeGreaterThan(0.85);
    expect(result.isSufficientlyRich).toBe(true);
  });

  it('should categorize sparse neighborhoods as hard', () => {
    const sparseRanks: RankedWordResult[] = Array.from({ length: 50 }, (_, i) => ({
      wordId: `id-${i}`,
      word: `word-${i}`,
      normalizedWord: `word-${i}`,
      semanticScore: 0.5 - i * 0.005, // Top 10 will have avg < 0.5
      rank: i + 1,
    }));

    const result = analyzePuzzleDifficulty(sparseRanks);
    expect(result.difficulty).toBe('hard');
    expect(result.top10AverageSimilarity).toBeLessThan(0.70);
  });
});
