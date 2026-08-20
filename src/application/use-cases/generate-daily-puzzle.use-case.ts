import { VocabularyRepository } from '../../infrastructure/database/repositories/vocabulary.repository.js';
import { PuzzleRepository } from '../../infrastructure/database/repositories/puzzle.repository.js';
import { IEmbeddingClient } from '../../infrastructure/ai/embedding-client.js';
import { computeDeterministicRanks } from '../../core/services/ranking-engine.js';
import { analyzePuzzleDifficulty } from '../../core/services/puzzle-analyzer.js';
import { normalizeWord } from '../../core/services/word-normalizer.js';
import { env } from '../../config/env.js';

export interface GeneratePuzzleCommand {
  date: string; // YYYY-MM-DD
  targetWord?: string;
  hint1?: string;
  hint2?: string;
  hint3?: string;
}

export interface GeneratedPuzzleResult {
  puzzleId: string;
  date: string;
  targetWord: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalRankedWords: number;
  top10AverageSimilarity: number;
}

export class GenerateDailyPuzzleUseCase {
  constructor(
    private vocabRepo: VocabularyRepository,
    private puzzleRepo: PuzzleRepository,
    private embeddingClient: IEmbeddingClient
  ) {}

  async execute(command: GeneratePuzzleCommand): Promise<GeneratedPuzzleResult> {
    const version = env.VOCABULARY_VERSION;

    // 1. Fetch entire active vocabulary for this version
    const vocabularyList = await this.vocabRepo.getAllWithEmbeddings(version);
    if (vocabularyList.length === 0) {
      throw new Error(`Cannot generate puzzle: vocabulary version "${version}" is empty.`);
    }

    // 2. Determine target word
    let targetWordRecord = null;
    if (command.targetWord) {
      const normalizedTarget = normalizeWord(command.targetWord);
      targetWordRecord = await this.vocabRepo.findByNormalizedWord(normalizedTarget, version);
      if (!targetWordRecord) {
        throw new Error(`Target word "${command.targetWord}" is not in the active vocabulary.`);
      }
    } else {
      // Pick a random word from vocabulary
      targetWordRecord = await this.vocabRepo.getRandomTarget(version);
      if (!targetWordRecord) {
        throw new Error('Failed to select target word from vocabulary.');
      }
    }

    // 3. Ensure target has an embedding
    let targetEmbedding = targetWordRecord.embedding;
    if (!targetEmbedding || targetEmbedding.length === 0) {
      targetEmbedding = await this.embeddingClient.embedWord(targetWordRecord.normalizedWord);
    }

    // 4. Compute deterministic rankings for all vocabulary words
    const rankedWords = computeDeterministicRanks(
      targetEmbedding,
      vocabularyList.map((item) => ({
        id: item.id,
        word: item.word,
        normalizedWord: item.normalizedWord,
        embedding: item.embedding as number[],
      })),
      targetWordRecord.normalizedWord
    );

    // 5. Analyze semantic neighborhood & difficulty
    const metrics = analyzePuzzleDifficulty(rankedWords);

    // 6. Create Daily Puzzle in Database
    const puzzle = await this.puzzleRepo.createDailyPuzzle({
      date: command.date,
      targetWordId: targetWordRecord.id,
      vocabularyVersion: version,
      hint1: command.hint1 || 'Associated with this concept.',
      hint2: command.hint2 || 'Often encountered in this context.',
      hint3: command.hint3 || 'Specifically describes this subject.',
      difficulty: metrics.difficulty,
      status: 'published',
    });

    // 7. Persist precomputed ranks
    await this.puzzleRepo.batchInsertPuzzleWords(
      rankedWords.map((item) => ({
        puzzleId: puzzle.id,
        wordId: item.wordId,
        semanticScore: item.semanticScore,
        rank: item.rank,
      })),
      500
    );

    return {
      puzzleId: puzzle.id,
      date: puzzle.date,
      targetWord: targetWordRecord.word,
      difficulty: metrics.difficulty,
      totalRankedWords: rankedWords.length,
      top10AverageSimilarity: metrics.top10AverageSimilarity,
    };
  }
}
