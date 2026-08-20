import { describe, it, expect } from 'vitest';
import { MockEmbeddingClient, createEmbeddingClient } from '../../../src/infrastructure/ai/embedding-client.js';
import { cosineSimilarity, vectorMagnitude } from '../../../src/core/services/vector-math.js';

describe('Infrastructure: Embedding Client', () => {
  it('should generate 768-dimensional normalized unit vector', async () => {
    const client = new MockEmbeddingClient(768);
    const embedding = await client.embedWord('airport');

    expect(embedding).toHaveLength(768);
    expect(vectorMagnitude(embedding)).toBeCloseTo(1.0, 4);
  });

  it('should generate identical embeddings for identical words (deterministic)', async () => {
    const client = new MockEmbeddingClient(768);
    const vec1 = await client.embedWord('airplane');
    const vec2 = await client.embedWord('airplane');

    expect(vec1).toEqual(vec2);
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(1.0, 5);
  });

  it('should generate distinct embeddings for different words', async () => {
    const client = new MockEmbeddingClient(768);
    const vec1 = await client.embedWord('airport');
    const vec2 = await client.embedWord('universe');

    expect(vec1).not.toEqual(vec2);
    const sim = cosineSimilarity(vec1, vec2);
    expect(sim).toBeLessThan(1.0);
  });

  it('should support batch embedding', async () => {
    const client = new MockEmbeddingClient(768);
    const words = ['pilot', 'radar', 'terminal'];
    const results = await client.batchEmbedWords(words);

    expect(results).toHaveLength(3);
    for (const vec of results) {
      expect(vec).toHaveLength(768);
      expect(vectorMagnitude(vec)).toBeCloseTo(1.0, 4);
    }
  });

  it('factory should return MockEmbeddingClient in test environment', () => {
    const client = createEmbeddingClient();
    expect(client).toBeInstanceOf(MockEmbeddingClient);
  });
});
