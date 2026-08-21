import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../../infrastructure/database/index.js';
import { communityRooms, communityMembers, users } from '../../../infrastructure/database/schema/index.js';
import { eq, and } from 'drizzle-orm';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORB-${randomPart}`;
}

export const communityRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Create a custom community / room
  fastify.post<{
    Body: { name: string; creatorId: string };
  }>('/communities/create', async (request, reply) => {
    const { name, creatorId } = request.body;
    if (!name?.trim() || !creatorId) {
      return reply.status(400).send({ message: 'Room name and creatorId are required' });
    }

    const roomName = name.trim();
    let code = generateRoomCode();
    
    // Ensure code uniqueness
    let existing = await db.query?.communityRooms?.findFirst({
      where: (r: any, { eq }: any) => eq(r.code, code),
    });
    while (existing) {
      code = generateRoomCode();
      existing = await db.query?.communityRooms?.findFirst({
        where: (r: any, { eq }: any) => eq(r.code, code),
      });
    }

    const inserted = await db
      .insert(communityRooms)
      .values({
        code,
        name: roomName,
        creatorId,
      })
      .returning();

    const room = inserted[0];

    // Auto-join creator to room
    await db
      .insert(communityMembers)
      .values({
        roomId: room.id,
        userId: creatorId,
      })
      .onConflictDoNothing();

    // Update user's active community
    await db.update(users).set({ community: roomName }).where(eq(users.id, creatorId));

    return reply.status(201).send({ room });
  });

  // 2. Join room via code
  fastify.post<{
    Body: { code: string; userId: string };
  }>('/communities/join', async (request, reply) => {
    const { code, userId } = request.body;
    if (!code?.trim() || !userId) {
      return reply.status(400).send({ message: 'Room code and userId are required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const rooms = await db
      .select()
      .from(communityRooms)
      .where(eq(communityRooms.code, cleanCode))
      .limit(1);

    if (!rooms.length) {
      return reply.status(404).send({ message: `No active room found with code: ${cleanCode}` });
    }

    const room = rooms[0];

    // Join room
    await db
      .insert(communityMembers)
      .values({
        roomId: room.id,
        userId,
      })
      .onConflictDoNothing();

    // Update user's active community
    await db.update(users).set({ community: room.name }).where(eq(users.id, userId));

    return reply.status(200).send({
      message: `Joined fleet: ${room.name}`,
      room,
    });
  });

  // 3. Get user's joined rooms
  fastify.get<{
    Params: { userId: string };
  }>('/communities/user/:userId', async (request, reply) => {
    const { userId } = request.params;
    const memberships = await db
      .select({
        id: communityRooms.id,
        code: communityRooms.code,
        name: communityRooms.name,
        createdAt: communityRooms.createdAt,
        joinedAt: communityMembers.joinedAt,
      })
      .from(communityMembers)
      .innerJoin(communityRooms, eq(communityMembers.roomId, communityRooms.id))
      .where(eq(communityMembers.userId, userId));

    return reply.status(200).send({ rooms: memberships });
  });

  // 4. Get room details by code
  fastify.get<{
    Params: { code: string };
  }>('/communities/room/:code', async (request, reply) => {
    const cleanCode = request.params.code.trim().toUpperCase();
    const rooms = await db
      .select()
      .from(communityRooms)
      .where(eq(communityRooms.code, cleanCode))
      .limit(1);

    if (!rooms.length) {
      return reply.status(404).send({ message: 'Room not found' });
    }

    return reply.status(200).send({ room: rooms[0] });
  });
};
