import { describe, it, expect } from 'vitest';
import {
  dotProduct,
  vectorMagnitude,
  cosineSimilarity,
  normalizeVector,
} from '../../../src/core/services/vector-math.js';

describe('Domain: Vector Math Engine', () => {
  describe('dotProduct', () => {
    it('should compute dot product correctly', () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
      expect(dotProduct(a, b)).toBe(32);
    });

    it('should throw on dimension mismatch', () => {
      expect(() => dotProduct([1, 2], [1, 2, 3])).toThrow('Vector dimension mismatch');
    });
  });

  describe('vectorMagnitude', () => {
    it('should compute Euclidean magnitude', () => {
      // sqrt(3^2 + 4^2) = 5
      expect(vectorMagnitude([3, 4])).toBe(5);
      expect(vectorMagnitude([0, 0, 0])).toBe(0);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1.0 for identical parallel vectors', () => {
      const a = [1, 2, 3];
      const b = [2, 4, 6];
      expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
    });

    it('should return 0.0 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('should return -1.0 for opposite vectors', () => {
      const a = [1, 0];
      const b = [-1, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
    });

    it('should return 0 when one vector is all zeros', () => {
      expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
    });
  });

  describe('normalizeVector', () => {
    it('should produce unit length vector (magnitude = 1.0)', () => {
      const vec = [3, 4];
      const normalized = normalizeVector(vec);
      expect(vectorMagnitude(normalized)).toBeCloseTo(1.0, 5);
      expect(normalized).toEqual([0.6, 0.8]);
    });
  });
});
