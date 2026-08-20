import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { normalizeVector } from '../../core/services/vector-math.js';
import crypto from 'crypto';

export interface IEmbeddingClient {
  embedWord(word: string): Promise<number[]>;
  batchEmbedWords(words: string[], chunkSize?: number): Promise<number[][]>;
}

/**
 * Deterministic Mock Embedding Generator for testing & offline development.
 * Uses SHA-256 hash of the word to seed a 768-dimensional normalized unit vector.
 */
export class MockEmbeddingClient implements IEmbeddingClient {
  private dimensions: number;

  constructor(dimensions = 768) {
    this.dimensions = dimensions;
  }

  async embedWord(word: string): Promise<number[]> {
    const rawVector: number[] = new Array(this.dimensions);
    const hash = crypto.createHash('sha256').update(word.toLowerCase().trim()).digest();

    for (let i = 0; i < this.dimensions; i++) {
      // Use repeating hash bytes as pseudo-random generator
      const byte1 = hash[i % hash.length];
      const byte2 = hash[(i + 7) % hash.length];
      const val = ((byte1 << 8) | byte2) / 65535 - 0.5; // range [-0.5, 0.5]
      rawVector[i] = val;
    }

    return normalizeVector(rawVector);
  }

  async batchEmbedWords(words: string[]): Promise<number[][]> {
    return Promise.all(words.map((w) => this.embedWord(w)));
  }
}

/**
 * Production Google Generative AI Embedding Client (text-embedding-004).
 */
export class GoogleEmbeddingClient implements IEmbeddingClient {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string = env.GEMINI_API_KEY, modelName: string = env.GEMINI_EMBEDDING_MODEL) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async embedWord(word: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const result = await model.embedContent(word);
    return result.embedding.values;
  }

  async batchEmbedWords(words: string[], chunkSize = 40): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const allEmbeddings: number[][] = [];

    let itemsProcessed = 0;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize);
      
      // If we are about to exceed 80 items, pause 60 seconds to reset quota
      if (itemsProcessed > 0 && itemsProcessed + chunk.length > 80) {
        console.log(`⏳ Approaching 100-word per minute limit (${itemsProcessed} processed). Sleeping 60s for quota reset...`);
        await new Promise((resolve) => setTimeout(resolve, 60000));
        itemsProcessed = 0;
      }

      try {
        const batchRequests = chunk.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
        }));

        const result = await model.batchEmbedContents({
          requests: batchRequests,
        });

        for (const item of result.embeddings) {
          allEmbeddings.push(item.values);
        }

        itemsProcessed += chunk.length;

        // Small sleep between batches
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error: any) {
        // Retry individual words with exponential backoff on 429 rate limit
        console.warn(`⚠️ Batch embedding failed for chunk at index ${i}, falling back to single items:`, error?.message);
        for (const singleWord of chunk) {
          // Add sleep delay for fallback retries to prevent hammering
          await new Promise((resolve) => setTimeout(resolve, 4000));
          const singleRes = await this.embedWord(singleWord);
          allEmbeddings.push(singleRes);
        }
      }
    }

    return allEmbeddings;
  }
}

/**
 * Factory function to create appropriate embedding client.
 */
export function createEmbeddingClient(): IEmbeddingClient {
  if (
    !env.GEMINI_API_KEY ||
    env.GEMINI_API_KEY === 'dummy_key_for_development' ||
    env.NODE_ENV === 'test'
  ) {
    return new MockEmbeddingClient(768);
  }
  return new GoogleEmbeddingClient();
}
