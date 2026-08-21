import { db } from '../database/index.js';
import { dailyPuzzles } from '../database/schema/puzzles.js';
import { vocabulary } from '../database/schema/vocabulary.js';
import { PuzzleRepository } from '../database/repositories/puzzle.repository.js';
import { createGeminiClient, IGeminiClient } from '../ai/gemini-client.js';
import { normalizeWord } from '../../core/services/word-normalizer.js';

const CURATED_TARGET_WORDS = [
  { word: 'satellite', hint1: 'An artificial or natural body in synchronous motion.', hint2: 'Transmits communications and monitors weather from high altitude.', hint3: 'Travels in orbit around a larger celestial object.' },
  { word: 'telescope', hint1: 'An optical instrument pointed toward the night sky.', hint2: 'Uses lenses or mirrors to focus distant starlight.', hint3: 'Reveals distant nebulae, galaxies, and planetary surfaces.' },
  { word: 'nebula', hint1: 'An interstellar cloud illuminated by young stars.', hint2: 'Composed of cosmic dust, hydrogen, and plasma gases.', hint3: 'Often called a stellar nursery where new stars are born.' },
  { word: 'gravity', hint1: 'A fundamental force of attraction across the universe.', hint2: 'Keeps planetary bodies locked in orbital motion.', hint3: 'Causes celestial objects with mass to pull toward each other.' },
  { word: 'comet', hint1: 'An icy cosmic traveler with an eccentric trajectory.', hint2: 'Outgasses a glowing coma as it approaches the sun.', hint3: 'Leaves a luminous dust tail trailing behind its frozen core.' },
  { word: 'galaxy', hint1: 'A massive gravitationally bound cosmic structure.', hint2: 'Contains billions of stars, solar systems, and dark matter.', hint3: 'Our solar system resides in a spiral one named the Milky Way.' },
  { word: 'astronaut', hint1: 'A trained voyager who travels beyond Earth atmosphere.', hint2: 'Wears a pressurized suit to conduct extravehicular spacewalks.', hint3: 'Operates missions aboard space stations and orbital capsules.' },
  { word: 'supernova', hint1: 'A catastrophic and brilliant cosmic event.', hint2: 'Outshines entire star systems in a sudden burst of radiation.', hint3: 'The explosive death of a massive star at the end of its life.' },
  { word: 'eclipse', hint1: 'A celestial alignment causing a shadow to fall.', hint2: 'Occurs when one astronomical body passes in front of another.', hint3: 'Blocks solar radiation or casts Earth shadow onto the moon.' },
  { word: 'aurora', hint1: 'A natural luminous light display in high latitude skies.', hint2: 'Triggered by solar wind collisions with the magnetosphere.', hint3: 'Creates shimmering green and violet curtains known as the Northern Lights.' },
];

export class DailyPuzzleService {
  constructor(
    private puzzleRepo: PuzzleRepository = new PuzzleRepository(),
    private geminiClient: IGeminiClient = createGeminiClient()
  ) {}

  /**
   * Ensure a puzzle exists for the given date. If not, automatically provision it.
   */
  async ensurePuzzleForDate(dateStr: string) {
    const existing = await this.puzzleRepo.findByDate(dateStr);
    if (existing) {
      return existing;
    }

    console.log(`✨ [DailyPuzzleService] Auto-provisioning puzzle for date: ${dateStr}...`);

    // Pick target word based on date hash
    const dateNum = dateStr.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
    const selected = CURATED_TARGET_WORDS[dateNum % CURATED_TARGET_WORDS.length];
    const targetWord = selected.word;
    const normalized = normalizeWord(targetWord);

    // 1. Ensure target word is in vocabulary table
    let vocabWord = await db.query?.vocabulary?.findFirst({
      where: (vocab: any, { eq }: any) => eq(vocab.normalizedWord, normalized),
    });

    if (!vocabWord) {
      const inserted = await db
        .insert(vocabulary)
        .values({
          word: targetWord,
          normalizedWord: normalized,
          embedding: [],
        })
        .onConflictDoNothing()
        .returning();
      vocabWord = inserted[0] || { id: (await this.puzzleRepo.findByDate(dateStr))?.targetWordId };
    }

    // 2. Generate hints (use curated or Gemini)
    let hints: [string, string, string] = [selected.hint1, selected.hint2, selected.hint3];
    try {
      hints = await this.geminiClient.generateHints(targetWord);
    } catch (err) {
      console.warn('Using curated hints fallback:', err);
    }

    // 3. Create Daily Puzzle row
    const puzzle = await this.puzzleRepo.createDailyPuzzle({
      date: dateStr,
      targetWordId: vocabWord.id,
      vocabularyVersion: 'v1',
      hint1: hints[0],
      hint2: hints[1],
      hint3: hints[2],
      difficulty: 'medium',
      status: 'published',
    });

    console.log(`🎉 [DailyPuzzleService] Successfully provisioned puzzle for ${dateStr} (Target: "${targetWord}")`);
    return this.puzzleRepo.findByDate(dateStr);
  }

  /**
   * Pre-generate upcoming 7 days of daily puzzles.
   */
  async preprovisionUpcomingPuzzles(daysAhead = 7) {
    const today = new Date();
    for (let i = 0; i <= daysAhead; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];
      await this.ensurePuzzleForDate(dateStr);
    }
  }

  /**
   * Start background hourly cron loop.
   */
  startScheduler() {
    // Run immediately on boot
    this.preprovisionUpcomingPuzzles(7).catch((err) =>
      console.error('Initial puzzle pre-provisioning error:', err)
    );

    // Run every hour
    setInterval(() => {
      this.preprovisionUpcomingPuzzles(3).catch((err) =>
        console.error('Cron puzzle pre-provisioning error:', err)
      );
    }, 60 * 60 * 1000);
  }
}
