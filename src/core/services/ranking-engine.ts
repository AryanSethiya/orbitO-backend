import { cosineSimilarity } from './vector-math.js';

export interface VocabularyItemForRanking {
  id: string;
  word: string;
  normalizedWord: string;
  embedding: number[];
}

export interface RankedWordResult {
  wordId: string;
  word: string;
  normalizedWord: string;
  semanticScore: number;
  rank: number;
}

/**
 * Computes deterministic ranks for all vocabulary words relative to a target embedding.
 * 
 * Rules:
 * 1. Primary sorting: semanticScore descending (highest similarity = closest to #1).
 * 2. Secondary sorting (tie-breaking): normalizedWord ascending alphabetically.
 * 3. Ranks are assigned 1-indexed (1, 2, 3, ... N).
 */
export function computeDeterministicRanks(
  targetEmbedding: number[],
  vocabularyList: VocabularyItemForRanking[],
  targetNormalizedWord?: string
): RankedWordResult[] {
  if (vocabularyList.length === 0) {
    return [];
  }

  // 1. Calculate similarity for each word
  const scoredItems = vocabularyList.map((item) => {
    let score = cosineSimilarity(targetEmbedding, item.embedding);
    
    // If this item is the target word itself, ensure it has maximum 1.0 score
    if (targetNormalizedWord && item.normalizedWord === targetNormalizedWord) {
      score = 1.0;
    }

    return {
      wordId: item.id,
      word: item.word,
      normalizedWord: item.normalizedWord,
      semanticScore: score,
    };
  });

  // 2. Deterministic Sort: similarity DESC, normalizedWord ASC (tie-breaker)
  scoredItems.sort((a, b) => {
    // 6-decimal precision rounding to handle floating point noise
    const diff = b.semanticScore - a.semanticScore;
    if (Math.abs(diff) > 1e-6) {
      return diff;
    }
    // Lexical tie-break
    return a.normalizedWord.localeCompare(b.normalizedWord);
  });

  // 3. Assign 1-indexed ranks
  return scoredItems.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
