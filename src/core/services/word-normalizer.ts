import { InvalidGuessError } from '../errors/domain-errors.js';

/**
 * Normalizes input word for consistent semantic comparison.
 * - Converts to lowercase
 * - Trims outer whitespaces
 * - Strips unwanted punctuation/special characters
 * - Validates length and alphabetic constraints
 */
export function normalizeWord(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new InvalidGuessError('Guess cannot be empty');
  }

  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z-]/g, ''); // Allow letters and hyphens (e.g. well-being)

  if (cleaned.length === 0) {
    throw new InvalidGuessError('Word must contain at least one valid alphabet character');
  }

  if (cleaned.length > 50) {
    throw new InvalidGuessError('Word exceeds maximum length of 50 characters');
  }

  return cleaned;
}
