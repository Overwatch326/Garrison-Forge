import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function registerUserRoutes(app: FastifyInstance) {
  // List costumes for a user
  app.get('/users/:id/costumes', async (req) => {
    const { id } = req.params as { id: string };

    // In this prototype, we don\'t enforce that the user exists in the DB.
    // We simply use the provided id as a namespace for costumes.
    const costumes = await prisma.userCostume.findMany({
      where: { userId: id },
      orderBy: { name: 'asc' },
    });

    return { costumes };
  });

  // Create a costume for a user
  app.post('/users/:id/costumes', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { name?: string; costumeType?: string; approved?: boolean };

    if (!body.name) return reply.badRequest('name is required');

    // Do not require that a User row exists yet; use id as logical owner.
    const costume = await prisma.userCostume.create({
      data: {
        name: body.name,
        costumeType: body.costumeType,
        approved: body.approved ?? false,
        userId: id,
      },
    });

    return { costume };
  });

  // Delete a costume
  app.delete('/costumes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.userCostume.findUnique({ where: { id } });
    if (!existing) return reply.notFound('Costume not found');
    await prisma.userCostume.delete({ where: { id } });
    return { ok: true };
  });
}
