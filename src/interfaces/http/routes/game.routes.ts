import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { db } from '../../../infrastructure/database/index.js';
import { users } from '../../../infrastructure/database/schema/users.js';
import { GameSessionRepository } from '../../../infrastructure/database/repositories/game-session.repository.js';
import { PuzzleRepository } from '../../../infrastructure/database/repositories/puzzle.repository.js';
import { VocabularyRepository } from '../../../infrastructure/database/repositories/vocabulary.repository.js';
import { AIRoastRepository } from '../../../infrastructure/database/repositories/ai-roast.repository.js';
import { createGeminiClient } from '../../../infrastructure/ai/gemini-client.js';
import { SubmitGuessUseCase } from '../../../application/use-cases/submit-guess.use-case.js';
import { RequestHintUseCase } from '../../../application/use-cases/request-hint.use-case.js';
import { GetSessionSummaryUseCase } from '../../../application/use-cases/get-session-summary.use-case.js';
import { GenerateRoastUseCase } from '../../../application/use-cases/generate-roast.use-case.js';
import {
  startSessionSchema,
  submitGuessSchema,
  sessionIdParamSchema,
  todayPuzzleQuerySchema,
} from '../schemas/game.schemas.js';
import { PuzzleNotFoundError } from '../../../core/errors/domain-errors.js';
import { z } from 'zod';

const roastBodySchema = z.object({
  style: z.enum(['friendly', 'savage', 'hype', 'balanced']).optional().default('balanced'),
});

export const gameRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const sessionRepo = new GameSessionRepository();
  const puzzleRepo = new PuzzleRepository();
  const vocabRepo = new VocabularyRepository();
  const roastRepo = new AIRoastRepository();
  const geminiClient = createGeminiClient();

  const submitGuessUseCase = new SubmitGuessUseCase(sessionRepo, puzzleRepo, vocabRepo);
  const requestHintUseCase = new RequestHintUseCase(sessionRepo, puzzleRepo);
  const getSessionSummaryUseCase = new GetSessionSummaryUseCase(sessionRepo, puzzleRepo);
  const generateRoastUseCase = new GenerateRoastUseCase(sessionRepo, puzzleRepo, roastRepo, geminiClient);

  /**
   * GET /api/v1/puzzles/today
   * Get public details for today's puzzle
   */
  server.get('/puzzles/today', async (request, reply) => {
    const query = todayPuzzleQuerySchema.parse(request.query);
    const dateStr = query.date || new Date().toISOString().split('T')[0];

    const puzzle = await puzzleRepo.findByDate(dateStr);
    if (!puzzle) {
      throw new PuzzleNotFoundError(dateStr);
    }

    return reply.status(200).send({
      id: puzzle.id,
      date: puzzle.date,
      difficulty: puzzle.difficulty,
      vocabularyVersion: puzzle.vocabularyVersion,
      status: puzzle.status,
    });
  });

  /**
   * POST /api/v1/sessions
   * Start or resume a game session
   */
  server.post('/sessions', async (request, reply) => {
    const body = startSessionSchema.parse(request.body || {});
    const dateStr = body.date || new Date().toISOString().split('T')[0];

    const puzzle = await puzzleRepo.findByDate(dateStr);
    if (!puzzle) {
      throw new PuzzleNotFoundError(dateStr);
    }

    // Default anonymous guest user if not authenticated
    let userId = body.userId;
    if (!userId) {
      const guestId = '00000000-0000-0000-0000-000000000000';
      // Ensure guest user exists
      await db
        .insert(users)
        .values({
          id: guestId,
          email: 'guest@orbito.local',
          username: 'Guest Explorer',
          passwordHash: 'guest_no_login_required',
        })
        .onConflictDoNothing();
      userId = guestId;
    }

    const session = await sessionRepo.getOrCreateSession({
      userId,
      puzzleId: puzzle.id,
    });

    const summary = await getSessionSummaryUseCase.execute(session.id);
    return reply.status(201).send(summary);
  });

  /**
   * POST /api/v1/sessions/:id/guess
   * Submit a guess
   */
  server.post('/sessions/:id/guess', async (request, reply) => {
    const params = sessionIdParamSchema.parse(request.params);
    const body = submitGuessSchema.parse(request.body);

    const result = await submitGuessUseCase.execute({
      sessionId: params.id,
      guess: body.guess,
    });

    return reply.status(200).send(result);
  });

  /**
   * POST /api/v1/sessions/:id/hints
   * Request the next progressive hint
   */
  server.post('/sessions/:id/hints', async (request, reply) => {
    const params = sessionIdParamSchema.parse(request.params);

    const result = await requestHintUseCase.execute({
      sessionId: params.id,
    });

    return reply.status(200).send(result);
  });

  /**
   * GET /api/v1/sessions/:id
   * Get full session state & journey
   */
  server.get('/sessions/:id', async (request, reply) => {
    const params = sessionIdParamSchema.parse(request.params);

    const result = await getSessionSummaryUseCase.execute(params.id);
    return reply.status(200).send(result);
  });

  /**
   * POST /api/v1/sessions/:id/roast
   * Generate or retrieve post-game AI Roast reaction
   */
  server.post('/sessions/:id/roast', async (request, reply) => {
    const params = sessionIdParamSchema.parse(request.params);
    const body = roastBodySchema.parse(request.body || {});

    const result = await generateRoastUseCase.execute({
      sessionId: params.id,
      style: body.style,
    });

    return reply.status(200).send(result);
  });
};
