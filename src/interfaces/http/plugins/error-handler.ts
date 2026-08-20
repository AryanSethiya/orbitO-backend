import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  DomainError,
  PuzzleNotFoundError,
  SessionNotFoundError,
  UnknownWordError,
  InvalidGuessError,
  HintLimitExceededError,
  SessionAlreadyCompletedError,
} from '../../../core/errors/domain-errors.js';
import { ZodError } from 'zod';

export function setupErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error(error);

    // Schema validation errors (Zod)
    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.errors,
      });
    }

    // Domain errors
    if (error instanceof PuzzleNotFoundError || error instanceof SessionNotFoundError) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message,
      });
    }

    if (error instanceof UnknownWordError) {
      return reply.status(422).send({
        statusCode: 422,
        error: 'Unprocessable Entity',
        code: 'UNKNOWN_WORD',
        message: error.message,
      });
    }

    if (
      error instanceof InvalidGuessError ||
      error instanceof HintLimitExceededError ||
      error instanceof SessionAlreadyCompletedError
    ) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }

    if (error instanceof DomainError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }

    // Default 500
    const statusCode = (error as FastifyError).statusCode || 500;
    return reply.status(statusCode).send({
      statusCode,
      error: 'Internal Server Error',
      message: statusCode === 500 ? 'An unexpected internal error occurred' : error.message,
    });
  });
}
