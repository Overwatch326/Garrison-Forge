import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function registerEventRoutes(app: FastifyInstance) {
  // List events with basic filtering (upcoming by default)
  app.get('/events', async (req) => {
    const query = req.query as { scope?: 'upcoming' | 'past' | 'all' };
    const now = new Date();

    let where: any = {};
    if (query.scope === 'upcoming' || !query.scope) {
      where = { startTime: { gte: now } };
    } else if (query.scope === 'past') {
      where = { startTime: { lt: now } };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        signups: {
          include: {
            costume: true,
          },
        },
      },
    });

    return { events };
  });

  // Create an event (for now, no auth enforcement here)
  app.post('/events', async (req, reply) => {
    const body = req.body as {
      title?: string;
      description?: string;
      official?: boolean;
      eventType?: string;
      participants?: string;
      costumes?: string;
      childrenOk?: boolean;
      weaponsAllowed?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
      createdById?: string;
    };

    if (!body.title || !body.location || !body.startTime) {
      return reply.badRequest('title, location, and startTime are required');
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        official: body.official ?? true,
        eventType: body.eventType || 'other',
        participants: body.participants || '501st-only',
        costumes: body.costumes,
        childrenOk: body.childrenOk ?? false,
        weaponsAllowed: body.weaponsAllowed || 'none',
        location: body.location,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        // createdById intentionally omitted until auth/users are wired to backend
      },
    });

    return { event };
  });

  // Update an event
  app.patch('/events/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<{
      title: string;
      description: string | null;
      official: boolean;
      eventType: string;
      participants: string;
      costumes: string | null;
      childrenOk: boolean;
      weaponsAllowed: string;
      location: string;
      startTime: string | null;
      endTime: string | null;
    }>;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return reply.notFound('Event not found');
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        description: body.description ?? existing.description,
        official: typeof body.official === 'boolean' ? body.official : existing.official,
        eventType: body.eventType ?? existing.eventType,
        participants: body.participants ?? existing.participants,
        costumes: body.costumes ?? existing.costumes,
        childrenOk:
          typeof body.childrenOk === 'boolean' ? body.childrenOk : existing.childrenOk,
        weaponsAllowed: body.weaponsAllowed ?? existing.weaponsAllowed,
        location: body.location ?? existing.location,
        startTime: body.startTime ? new Date(body.startTime) : existing.startTime,
        endTime: body.endTime ? new Date(body.endTime) : existing.endTime,
      },
    });

    return { event };
  });

  // Delete an event (and its signups)
  app.delete('/events/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return reply.notFound('Event not found');
    }

    // Delete child signups first to satisfy FK constraints
    await prisma.eventSignup.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });

    return { ok: true };
  });

  // Create a signup for an event
  app.post('/events/:id/signups', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      userId?: string;
      userDisplayName?: string;
      userEmail?: string;
      costumeId?: string;
      notes?: string;
    };

    if (!body.userId) {
      return reply.badRequest('userId is required');
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return reply.notFound('Event not found');
    }

    const signup = await prisma.eventSignup.create({
      data: {
        eventId: id,
        userId: body.userId,
        userDisplayName: body.userDisplayName,
        userEmail: body.userEmail,
        costumeId: body.costumeId,
        notes: body.notes,
        status: 'signed_up',
      },
    });

    return { signup };
  });

  // Update a signup (e.g. attended / not attended / cancelled)
  app.patch('/signups/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      status?: string;
      notes?: string | null;
      costumeId?: string | null;
    };

    const existing = await prisma.eventSignup.findUnique({ where: { id } });
    if (!existing) {
      return reply.notFound('Signup not found');
    }

    const signup = await prisma.eventSignup.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        notes: body.notes ?? existing.notes,
        costumeId:
          typeof body.costumeId === 'string' || body.costumeId === null
            ? body.costumeId
            : existing.costumeId,
      },
    });

    return { signup };
  });
}
