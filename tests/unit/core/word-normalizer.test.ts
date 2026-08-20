import { describe, it, expect } from 'vitest';
import { normalizeWord } from '../../../src/core/services/word-normalizer.js';
import { InvalidGuessError } from '../../../src/core/errors/domain-errors.js';

describe('Domain: Word Normalizer', () => {
  it('should convert uppercase and mixed case to lowercase', () => {
    expect(normalizeWord('AIRPORT')).toBe('airport');
    expect(normalizeWord('Flight')).toBe('flight');
    expect(normalizeWord('TeRmiNaL')).toBe('terminal');
  });

  it('should trim surrounding whitespace', () => {
    expect(normalizeWord('   runway   ')).toBe('runway');
    expect(normalizeWord('\n\tplane\t ')).toBe('plane');
  });

  it('should preserve valid hyphens and strip non-alpha characters', () => {
    expect(normalizeWord('well-being!')).toBe('well-being');
    expect(normalizeWord('hello 123')).toBe('hello');
    expect(normalizeWord('co-pilot#')).toBe('co-pilot');
  });

  it('should throw InvalidGuessError on empty or whitespace-only inputs', () => {
    expect(() => normalizeWord('')).toThrow(InvalidGuessError);
    expect(() => normalizeWord('   ')).toThrow(InvalidGuessError);
    expect(() => normalizeWord('!@#$%^')).toThrow(InvalidGuessError);
  });

  it('should throw InvalidGuessError if word exceeds 50 characters', () => {
    const longWord = 'a'.repeat(51);
    expect(() => normalizeWord(longWord)).toThrow(InvalidGuessError);
  });
});
