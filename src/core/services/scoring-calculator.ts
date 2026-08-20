export interface ScoringConfig {
  startingScore: number;
  guessPenalty: number;
  hintPenalties: [number, number, number]; // Penalties for hint 1, 2, 3
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  startingScore: 1000,
  guessPenalty: 5,
  hintPenalties: [100, 200, 350],
};

export interface ScoreCalculationResult {
  baseScore: number;
  guessesCount: number;
  guessPenaltyTotal: number;
  hintsUsed: number;
  hintPenaltyTotal: number;
  finalScore: number;
}

/**
 * Calculates deterministic final score.
 * Formula: Math.max(0, startingScore - (guesses * guessPenalty) - sum(hintPenalties))
 */
export function calculateFinalScore(
  guessesCount: number,
  hintsUsed: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): ScoreCalculationResult {
  const safeGuesses = Math.max(0, guessesCount);
  const safeHints = Math.min(3, Math.max(0, hintsUsed));

  const guessPenaltyTotal = safeGuesses * config.guessPenalty;

  let hintPenaltyTotal = 0;
  for (let i = 0; i < safeHints; i++) {
    hintPenaltyTotal += config.hintPenalties[i];
  }

  const rawScore = config.startingScore - guessPenaltyTotal - hintPenaltyTotal;
  const finalScore = Math.max(0, rawScore);

  return {
    baseScore: config.startingScore,
    guessesCount: safeGuesses,
    guessPenaltyTotal,
    hintsUsed: safeHints,
    hintPenaltyTotal,
    finalScore,
  };
}
