import { GameSessionRepository } from '../../infrastructure/database/repositories/game-session.repository.js';
import { PuzzleRepository } from '../../infrastructure/database/repositories/puzzle.repository.js';
import { VocabularyRepository } from '../../infrastructure/database/repositories/vocabulary.repository.js';
import { LeaderboardService } from '../../infrastructure/cache/leaderboard.service.js';
import { createGeminiClient, IGeminiClient } from '../../infrastructure/ai/gemini-client.js';
import { normalizeWord } from '../../core/services/word-normalizer.js';
import { getProximitySignal, ProximitySignal } from '../../core/services/proximity-classifier.js';
import { calculateFinalScore, ScoreCalculationResult } from '../../core/services/scoring-calculator.js';
import {
  SessionNotFoundError,
  SessionAlreadyCompletedError,
  PuzzleNotFoundError,
} from '../../core/errors/domain-errors.js';
import { db } from '../../infrastructure/database/index.js';
import { vocabulary } from '../../infrastructure/database/schema/vocabulary.js';

export interface SubmitGuessCommand {
  sessionId: string;
  guess: string;
  username?: string;
}

export interface SubmitGuessResult {
  word: string;
  normalizedWord: string;
  rank: number;
  semanticScore: number;
  signal: ProximitySignal;
  guessesCount: number;
  isSolved: boolean;
  scoreBreakdown: ScoreCalculationResult | null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function calculateRankFromSimilarity(similarity: number): number {
  if (similarity >= 0.999) return 1;
  if (similarity >= 0.88) return Math.floor(2 + (0.999 - similarity) * 40); // 2 - 6
  if (similarity >= 0.75) return Math.floor(7 + (0.88 - similarity) * 350); // 7 - 52
  if (similarity >= 0.60) return Math.floor(53 + (0.75 - similarity) * 1500); // 53 - 278
  if (similarity >= 0.45) return Math.floor(279 + (0.60 - similarity) * 4500); // 279 - 954
  if (similarity >= 0.30) return Math.floor(955 + (0.45 - similarity) * 25000); // 955 - 4705
  return Math.floor(4706 + Math.max(0, (0.30 - similarity)) * 50000); // 4706 - 19706
}

export class SubmitGuessUseCase {
  constructor(
    private sessionRepo: GameSessionRepository,
    private puzzleRepo: PuzzleRepository,
    private vocabRepo: VocabularyRepository,
    private geminiClient: IGeminiClient = createGeminiClient(),
    private leaderboardService: LeaderboardService = new LeaderboardService()
  ) {}

  async execute(command: SubmitGuessCommand): Promise<SubmitGuessResult> {
    // 1. Retrieve session
    const session = await this.sessionRepo.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }

    if (session.solved) {
      throw new SessionAlreadyCompletedError(command.sessionId);
    }

    const puzzle = await this.puzzleRepo.findById(session.puzzleId);
    if (!puzzle) {
      throw new PuzzleNotFoundError(session.puzzleId);
    }

    // 2. Normalize guess
    const normalized = normalizeWord(command.guess);
    const targetWordNorm = normalizeWord(puzzle.targetWord);

    let rank = 9999;
    let semanticScore = 0.1;
    const isSolved = normalized === targetWordNorm;

    if (isSolved) {
      rank = 1;
      semanticScore = 1.0;
    } else {
      // Check pre-computed ranks in database first
      const existingVocab = await this.vocabRepo.findByNormalizedWord(normalized);
      let rankedWord = null;
      if (existingVocab) {
        rankedWord = await this.puzzleRepo.getRankForWord(session.puzzleId, existingVocab.id);
      }

      if (rankedWord) {
        rank = rankedWord.rank;
        semanticScore = rankedWord.semanticScore;
      } else {
        // Dynamic On-the-fly Gemini Semantic Vector Computation
        const [guessVec, targetVec] = await Promise.all([
          this.geminiClient.generateEmbedding(normalized),
          this.geminiClient.generateEmbedding(targetWordNorm),
        ]);

        const rawSim = cosineSimilarity(guessVec, targetVec);
        semanticScore = Number(rawSim.toFixed(4));
        rank = calculateRankFromSimilarity(rawSim);
      }
    }

    // 3. Ensure word exists in vocabulary table
    let vocabEntry = await this.vocabRepo.findByNormalizedWord(normalized);
    if (!vocabEntry) {
      const inserted = await db
        .insert(vocabulary)
        .values({
          word: command.guess.trim(),
          normalizedWord: normalized,
          vectorEmbedding: [],
        })
        .onConflictDoNothing()
        .returning();
      vocabEntry = inserted[0] || (await this.vocabRepo.findByNormalizedWord(normalized));
    }

    const wordId = vocabEntry?.id || puzzle.targetWordId;

    // 4. Record Guess
    await this.sessionRepo.recordGuess(
      session.id,
      wordId,
      semanticScore,
      rank
    );

    const updatedGuessCount = session.guessesCount + 1;
    const signal = getProximitySignal(rank);
    let scoreBreakdown: ScoreCalculationResult | null = null;

    // 5. If solved (Rank #1), complete session and lock final score
    if (isSolved) {
      scoreBreakdown = calculateFinalScore(updatedGuessCount, session.hintsUsed);
      await this.sessionRepo.completeSession(session.id, scoreBreakdown.finalScore);

      // Record to Redis leaderboard
      await this.leaderboardService.recordScore(
        puzzle.date,
        session.userId,
        command.username || 'Astronaut Pilot',
        scoreBreakdown.finalScore
      );
    }

    return {
      word: command.guess.trim(),
      normalizedWord: normalized,
      rank,
      semanticScore,
      signal,
      guessesCount: updatedGuessCount,
      isSolved,
      scoreBreakdown,
    };
  }
}
