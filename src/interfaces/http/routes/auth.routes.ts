import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { db } from '../../../infrastructure/database/index.js';
import { users } from '../../../infrastructure/database/schema/users.js';
import { eq } from 'drizzle-orm';
import { env } from '../../../config/env.js';

const JWT_SECRET = process.env.JWT_SECRET || 'orbito_jwt_super_secret_signing_key_2026';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');

const googleAuthSchema = z.object({
  credential: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  googleId: z.string().optional(),
  community: z.string().optional(),
});

const devLoginSchema = z.object({
  callsign: z.string().min(1).max(50),
  community: z.string().optional().default('Global Explorers'),
  avatarUrl: z.string().optional(),
});

const updateCommunitySchema = z.object({
  userId: z.string().uuid(),
  community: z.string().min(2).max(60),
});

export const authRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  /**
   * POST /api/v1/auth/google
   * Authenticate pilot with Google Sign-In
   */
  server.post('/auth/google', async (request, reply) => {
    const body = googleAuthSchema.parse(request.body || {});

    let email = body.email;
    let name = body.name || 'Orbital Pilot';
    let picture = body.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
    let googleId = body.googleId || '';

    // If Google ID token was passed, verify cryptographically
    if (body.credential && process.env.GOOGLE_CLIENT_ID) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: body.credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          email = payload.email;
          name = payload.name || name;
          picture = payload.picture || picture;
          googleId = payload.sub;
        }
      } catch (err) {
        console.warn('Google verify fallback (using client payload):', err);
      }
    }

    if (!email) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Google authentication requires a valid email address.',
      });
    }

    // Username derived from name / email
    const cleanUsername = name.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 24);
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    let userRecord = existing[0];
    if (!userRecord) {
      const inserted = await db
        .insert(users)
        .values({
          email,
          username: `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`,
          name,
          avatarUrl: picture,
          googleId,
          community: body.community || 'Global Explorers',
        })
        .returning();
      userRecord = inserted[0];
    } else {
      const updated = await db
        .update(users)
        .set({
          name: name || userRecord.name,
          avatarUrl: picture || userRecord.avatarUrl,
          googleId: googleId || userRecord.googleId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRecord.id))
        .returning();
      userRecord = updated[0];
    }

    const token = jwt.sign(
      {
        userId: userRecord.id,
        email: userRecord.email,
        username: userRecord.username,
        name: userRecord.name,
        avatarUrl: userRecord.avatarUrl,
        community: userRecord.community,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return reply.status(200).send({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        username: userRecord.username,
        name: userRecord.name,
        avatarUrl: userRecord.avatarUrl,
        community: userRecord.community || 'Global Explorers',
      },
      token,
    });
  });

  /**
   * POST /api/v1/auth/dev-login
   * Instant Pilot Auth for testing & dev without requiring live OAuth keys
   */
  server.post('/auth/dev-login', async (request, reply) => {
    const body = devLoginSchema.parse(request.body || {});
    const email = `${body.callsign.toLowerCase().replace(/[^a-z0-9]/g, '')}@orbito.local`;
    const cleanUsername = body.callsign.replace(/[^a-zA-Z0-9_]/g, '_');
    const picture = body.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(body.callsign)}`;

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let userRecord = existing[0];

    if (!userRecord) {
      const inserted = await db
        .insert(users)
        .values({
          email,
          username: cleanUsername,
          name: body.callsign,
          avatarUrl: picture,
          community: body.community,
        })
        .onConflictDoNothing()
        .returning();
      userRecord = inserted[0] || (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    }

    const token = jwt.sign(
      {
        userId: userRecord.id,
        email: userRecord.email,
        username: userRecord.username,
        name: userRecord.name,
        avatarUrl: userRecord.avatarUrl,
        community: userRecord.community,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return reply.status(200).send({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        username: userRecord.username,
        name: userRecord.name,
        avatarUrl: userRecord.avatarUrl,
        community: userRecord.community || 'Global Explorers',
      },
      token,
    });
  });

  /**
   * GET /api/v1/auth/me
   * Retrieve current pilot profile from Bearer JWT
   */
  server.get('/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userList = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      const userRecord = userList[0];

      if (!userRecord) {
        return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
      }

      return reply.status(200).send({
        id: userRecord.id,
        email: userRecord.email,
        username: userRecord.username,
        name: userRecord.name,
        avatarUrl: userRecord.avatarUrl,
        community: userRecord.community || 'Global Explorers',
      });
    } catch {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });

  /**
   * PATCH /api/v1/auth/community
   * Switch active Community / Fleet
   */
  server.patch('/auth/community', async (request, reply) => {
    const body = updateCommunitySchema.parse(request.body);
    const updated = await db
      .update(users)
      .set({ community: body.community, updatedAt: new Date() })
      .where(eq(users.id, body.userId))
      .returning();

    return reply.status(200).send({
      success: true,
      community: updated[0]?.community || body.community,
    });
  });
};
