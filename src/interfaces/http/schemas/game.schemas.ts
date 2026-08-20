import { z } from 'zod';

export const startSessionSchema = z.object({
  userId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
});

export const submitGuessSchema = z.object({
  guess: z.string().min(1, 'Guess cannot be empty').max(50, 'Guess too long'),
});

export const sessionIdParamSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
});

export const todayPuzzleQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
