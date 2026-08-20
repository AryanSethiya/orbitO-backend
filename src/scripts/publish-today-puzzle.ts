import { VocabularyRepository } from '../infrastructure/database/repositories/vocabulary.repository.js';
import { PuzzleRepository } from '../infrastructure/database/repositories/puzzle.repository.js';
import { createEmbeddingClient } from '../infrastructure/ai/embedding-client.js';
import { GenerateDailyPuzzleUseCase } from '../application/use-cases/generate-daily-puzzle.use-case.js';
import { pool } from '../infrastructure/database/index.js';

async function publishTodayPuzzle() {
  const vocabRepo = new VocabularyRepository();
  const puzzleRepo = new PuzzleRepository();
  const embeddingClient = createEmbeddingClient();
  const useCase = new GenerateDailyPuzzleUseCase(vocabRepo, puzzleRepo, embeddingClient);

  const today = new Date().toISOString().split('T')[0];
  console.log(`\n📅 Generating & publishing daily puzzle for: ${today}...`);

  try {
    const existing = await puzzleRepo.findByDate(today);
    if (existing) {
      console.log(`✅ Puzzle for ${today} already published! ID: ${existing.id}, Target: ${existing.targetWord}`);
      return;
    }

    const result = await useCase.execute({
      date: today,
      targetWord: 'airport',
      hint1: 'A busy transit hub where long journeys begin.',
      hint2: 'Travelers pass through security gates and baggage check-in here.',
      hint3: 'Aircraft take off and land along dedicated runways.',
    });

    console.log('🎉 Today\'s Puzzle Published Successfully!');
    console.log(result);
  } catch (error: any) {
    console.error('❌ Failed to publish daily puzzle:', error?.message || error);
  } finally {
    await pool.end();
  }
}

publishTodayPuzzle();
