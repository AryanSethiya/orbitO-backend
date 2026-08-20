import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/interfaces/http/server.js';
import { FastifyInstance } from 'fastify';

describe('Integration: Fastify Game & Health Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health should respond with service statuses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    // When postgres/redis is not connected in pure local test, it returns 503 degraded
    expect([200, 503]).toContain(response.statusCode);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('services');
  });

  it('POST /api/v1/sessions/:id/guess with invalid body should return 400 Bad Request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions/00000000-0000-0000-0000-000000000000/guess',
      payload: { guess: '' }, // empty guess violates Zod min(1)
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad Request');
  });

  it('POST /api/v1/sessions with invalid date format should return 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: { date: 'invalid-date-str' },
    });

    expect(response.statusCode).toBe(400);
  });
});
