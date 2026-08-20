import { describe, it, expect } from 'vitest';
import { calculateFinalScore, DEFAULT_SCORING_CONFIG } from '../../../src/core/services/scoring-calculator.js';

describe('Domain: Scoring Calculator', () => {
  it('should calculate perfect score with 1 guess and 0 hints', () => {
    // 1000 - (1 * 5) = 995
    const result = calculateFinalScore(1, 0);
    expect(result.finalScore).toBe(995);
    expect(result.guessPenaltyTotal).toBe(5);
    expect(result.hintPenaltyTotal).toBe(0);
  });

  it('should calculate score with multiple guesses and no hints', () => {
    // 1000 - (20 * 5) = 900
    const result = calculateFinalScore(20, 0);
    expect(result.finalScore).toBe(900);
    expect(result.guessPenaltyTotal).toBe(100);
    expect(result.hintPenaltyTotal).toBe(0);
  });

  it('should apply correct progressive hint penalties', () => {
    // Hint 1: 100 penalty => 1000 - 50 - 100 = 850
    const result1 = calculateFinalScore(10, 1);
    expect(result1.hintPenaltyTotal).toBe(100);
    expect(result1.finalScore).toBe(850);

    // Hint 1 + Hint 2: 100 + 200 = 300 penalty => 1000 - 50 - 300 = 650
    const result2 = calculateFinalScore(10, 2);
    expect(result2.hintPenaltyTotal).toBe(300);
    expect(result2.finalScore).toBe(650);

    // Hint 1 + Hint 2 + Hint 3: 100 + 200 + 350 = 650 penalty => 1000 - 50 - 650 = 300
    const result3 = calculateFinalScore(10, 3);
    expect(result3.hintPenaltyTotal).toBe(650);
    expect(result3.finalScore).toBe(300);
  });

  it('should clamp final score to minimum of 0', () => {
    // 1000 - (300 * 5 = 1500) - 650 = -1150 => clamped to 0
    const result = calculateFinalScore(300, 3);
    expect(result.finalScore).toBe(0);
  });

  it('should allow custom scoring configuration', () => {
    const customConfig = {
      startingScore: 500,
      guessPenalty: 10,
      hintPenalties: [50, 100, 150] as [number, number, number],
    };

    const result = calculateFinalScore(5, 1, customConfig);
    // 500 - (5 * 10) - 50 = 400
    expect(result.finalScore).toBe(400);
  });
});
