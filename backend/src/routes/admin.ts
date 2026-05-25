import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function registerAdminRoutes(app: FastifyInstance) {
  app.post('/admin/backup', async (_req, reply) => {
    // TODO: plug in real auth/role checks once JWT roles are wired
    const now = new Date();

    const [
      users,
      garrisons,
      memberships,
      projects,
      phases,
      components,
      tasks,
      vendorResources,
      taskImages,
      events,
      eventSignups,
      userCostumes,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.garrison.findMany(),
      prisma.membership.findMany(),
      prisma.project.findMany(),
      prisma.phase.findMany(),
      prisma.component.findMany(),
      prisma.task.findMany(),
      prisma.vendorResource.findMany(),
      prisma.taskImage.findMany(),
      prisma.event.findMany(),
      prisma.eventSignup.findMany(),
      prisma.userCostume.findMany(),
    ]);

    const payload = {
      version: 1,
      generatedAt: now.toISOString(),
      users,
      garrisons,
      memberships,
      projects,
      phases,
      components,
      tasks,
      vendorResources,
      taskImages,
      events,
      eventSignups,
      userCostumes,
    };

    const filenameSafeTimestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `garrison-forge-backup-${filenameSafeTimestamp}.json`;

    return reply
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(payload);
  });
}
