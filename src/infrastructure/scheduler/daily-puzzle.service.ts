import { db } from '../database/index.js';
import { dailyPuzzles } from '../database/schema/puzzles.js';
import { vocabulary } from '../database/schema/vocabulary.js';
import { PuzzleRepository } from '../database/repositories/puzzle.repository.js';
import { createGeminiClient, IGeminiClient } from '../ai/gemini-client.js';
import { normalizeWord } from '../../core/services/word-normalizer.js';

const CURATED_TARGET_WORDS = [
  { word: 'guitar', hint1: 'An acoustic or electric instrument with resonant strings.', hint2: 'Played with fingers or a plectrum across fretted wooden neck.', hint3: 'Common in rock, jazz, and flamenco melodies.' },
  { word: 'coffee', hint1: 'A warm roasted aromatic brew beloved worldwide.', hint2: 'Extracted from ground beans rich in stimulating caffeine.', hint3: 'Enjoyed as espresso, cappuccino, or cold brew.' },
  { word: 'diamond', hint1: 'An allotrope of pure carbon formed under extreme pressure.', hint2: 'The hardest known natural mineral on the Mohs scale.', hint3: 'Cut and polished into sparkling jewelry.' },
  { word: 'mountain', hint1: 'A massive geological landform rising high above surroundings.', hint2: 'Features steep ridges, rocky cliffs, and snowy peaks.', hint3: 'Climbed by mountaineers seeking panoramic vistas.' },
  { word: 'whisper', hint1: 'A hushed and secretive mode of human speech.', hint2: 'Produced without vocal cord vibration to avoid eavesdropping.', hint3: 'Shared quietly into someone ear.' },
  { word: 'camera', hint1: 'An optical device designed to capture fleeting moments.', hint2: 'Uses lenses, apertures, and sensors to record light exposure.', hint3: 'Produces photographs and cinematography.' },
  { word: 'castle', hint1: 'A fortified medieval stone stronghold.', hint2: 'Surrounded by moats, battlements, and defensive turrets.', hint3: 'Historic residence of royalty and knights.' },
  { word: 'ocean', hint1: 'A vast continuous expanse of saltwater covering Earth surface.', hint2: 'Drives global weather patterns, tides, and marine ecosystems.', hint3: 'Home to coral reefs, whales, and the Mariana Trench.' },
  { word: 'flame', hint1: 'The visible, luminous gaseous part of a fire.', hint2: 'Emits intense heat and light through rapid chemical oxidation.', hint3: 'Ignited by matches, candles, or campfires.' },
  { word: 'compass', hint1: 'A timeless navigational instrument for direction finding.', hint2: 'A magnetized needle aligns with Earth magnetic poles.', hint3: 'Points reliably toward magnetic North.' },
  { word: 'labyrinth', hint1: 'A complex intricate maze of passages.', hint2: 'Designed to disorient travelers seeking the center or exit.', hint3: 'Famous in Greek mythology for housing the Minotaur.' },
  { word: 'galaxy', hint1: 'A massive gravitationally bound cosmic structure.', hint2: 'Contains billions of stars, solar systems, and dark matter.', hint3: 'Our solar system resides in a spiral one named the Milky Way.' },
  { word: 'pyramid', hint1: 'A monumental ancient architectural structure with triangular faces.', hint2: 'Built in Giza and Mesoamerica as sacred tombs and temples.', hint3: 'Tapers upward from a square base to a single apex.' },
  { word: 'symphony', hint1: 'An elaborate orchestral musical composition.', hint2: 'Comprises multiple movements performed by brass, strings, and woodwinds.', hint3: 'Masterpieces composed by Beethoven, Mozart, and Mahler.' },
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
      let targetVec: number[] = [];
      try {
        targetVec = await this.geminiClient.generateEmbedding(targetWord);
      } catch {}
      const inserted = await db
        .insert(vocabulary)
        .values({
          word: targetWord,
          normalizedWord: normalized,
          embedding: targetVec?.length === 768 ? targetVec : new Array(768).fill(0),
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
