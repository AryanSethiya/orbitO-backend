import { STARTER_VOCABULARY } from '../infrastructure/data/starter-words.js';
import { normalizeWord } from '../core/services/word-normalizer.js';
import { createEmbeddingClient } from '../infrastructure/ai/embedding-client.js';
import { VocabularyRepository } from '../infrastructure/database/repositories/vocabulary.repository.js';
import { pool } from '../infrastructure/database/index.js';
import { env } from '../config/env.js';

async function seedVocabulary() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`\n🌱 Starting Vocabulary Ingestion (version: ${env.VOCABULARY_VERSION}, dryRun: ${isDryRun})...`);

  // 1. Normalize and deduplicate
  const rawWords = STARTER_VOCABULARY;
  const uniqueNormalized = new Map<string, string>(); // normalized -> original

  for (const raw of rawWords) {
    try {
      const normalized = normalizeWord(raw);
      if (!uniqueNormalized.has(normalized)) {
        uniqueNormalized.set(normalized, raw);
      }
    } catch {
      // ignore invalid tokens
    }
  }

  const wordsToEmbed = Array.from(uniqueNormalized.entries()).map(([normalized, original]) => ({
    word: original,
    normalizedWord: normalized,
  }));

  console.log(`📚 Curated ${wordsToEmbed.length} unique valid vocabulary words.`);

  // 2. Generate Embeddings
  const embeddingClient = createEmbeddingClient();
  console.log(`🤖 Generating vector embeddings using ${embeddingClient.constructor.name}...`);
  
  const startTime = Date.now();
  const wordStrings = wordsToEmbed.map((w) => w.normalizedWord);
  const embeddings = await embeddingClient.batchEmbedWords(wordStrings, 50);
  const durationMs = Date.now() - startTime;

  console.log(`✅ Generated ${embeddings.length} embeddings in ${durationMs}ms (dimensions: ${embeddings[0]?.length || 0}).`);

  if (isDryRun) {
    console.log('✨ Dry-run complete. No database changes were made.');
    return;
  }

  // 3. Database Insertion
  try {
    const vocabRepo = new VocabularyRepository();
    const itemsToInsert = wordsToEmbed.map((item, index) => ({
      word: item.word,
      normalizedWord: item.normalizedWord,
      embedding: embeddings[index],
      vocabularyVersion: env.VOCABULARY_VERSION,
      isActive: true,
    }));

    await vocabRepo.batchUpsert(itemsToInsert, 100);
    const totalCount = await vocabRepo.count(env.VOCABULARY_VERSION);
    console.log(`🎉 Successfully persisted vocabulary! Total active words in DB: ${totalCount}`);
  } catch (error: any) {
    console.error('❌ Database insertion failed (ensure PostgreSQL is running):', error?.message || error);
  } finally {
    await pool.end();
  }
}

seedVocabulary().catch((err) => {
  console.error('Fatal error during vocabulary seeding:', err);
  process.exit(1);
});
