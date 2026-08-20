import { RankedWordResult } from './ranking-engine.js';

export interface PuzzleDifficultyMetrics {
  difficulty: 'easy' | 'medium' | 'hard';
  top10AverageSimilarity: number;
  top50AverageSimilarity: number;
  semanticSpread: number; // difference between rank 2 and rank 50
  isSufficientlyRich: boolean;
}

/**
 * Analyzes semantic neighborhood to categorize puzzle difficulty.
 */
export function analyzePuzzleDifficulty(rankedWords: RankedWordResult[]): PuzzleDifficultyMetrics {
  if (rankedWords.length < 10) {
    return {
      difficulty: 'hard',
      top10AverageSimilarity: 0,
      top50AverageSimilarity: 0,
      semanticSpread: 0,
      isSufficientlyRich: false,
    };
  }

  // Skip rank 1 (which is the target itself with similarity ~1.0)
  const top10 = rankedWords.slice(1, 11);
  const top50 = rankedWords.slice(1, Math.min(51, rankedWords.length));

  const sumTop10 = top10.reduce((acc, curr) => acc + curr.semanticScore, 0);
  const avgTop10 = sumTop10 / top10.length;

  const sumTop50 = top50.reduce((acc, curr) => acc + curr.semanticScore, 0);
  const avgTop50 = sumTop50 / top50.length;

  const rank2Score = top10[0]?.semanticScore || 0;
  const rank50Score = top50[top50.length - 1]?.semanticScore || 0;
  const semanticSpread = rank2Score - rank50Score;

  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (avgTop10 >= 0.85) {
    difficulty = 'easy';
  } else if (avgTop10 < 0.70) {
    difficulty = 'hard';
  }

  // A puzzle is rich if rank 2 has strong semantic proximity (> 0.5)
  const isSufficientlyRich = rank2Score >= 0.5 && top50.length >= 10;

  return {
    difficulty,
    top10AverageSimilarity: Number(avgTop10.toFixed(4)),
    top50AverageSimilarity: Number(avgTop50.toFixed(4)),
    semanticSpread: Number(semanticSpread.toFixed(4)),
    isSufficientlyRich,
  };
}
