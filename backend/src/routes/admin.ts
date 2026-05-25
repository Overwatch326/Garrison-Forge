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
      .header('Content-Disposition', `attachment; filename=\"${filename}\"`)
      .send(payload);
  });

  app.post('/admin/restore', async (req, reply) => {
    if (process.env.ALLOW_RESTORE !== 'true') {
      return reply.forbidden('Restore is disabled');
    }

    const [
      userCount,
      garrisonCount,
      membershipCount,
      projectCount,
      phaseCount,
      componentCount,
      taskCount,
      vendorCount,
      imageCount,
      eventCount,
      signupCount,
      costumeCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.garrison.count(),
      prisma.membership.count(),
      prisma.project.count(),
      prisma.phase.count(),
      prisma.component.count(),
      prisma.task.count(),
      prisma.vendorResource.count(),
      prisma.taskImage.count(),
      prisma.event.count(),
      prisma.eventSignup.count(),
      prisma.userCostume.count(),
    ]);

    const totalExisting =
      userCount +
      garrisonCount +
      membershipCount +
      projectCount +
      phaseCount +
      componentCount +
      taskCount +
      vendorCount +
      imageCount +
      eventCount +
      signupCount +
      costumeCount;

    if (totalExisting > 0) {
      return reply.badRequest('Database is not empty; refusing to restore.');
    }

    const body = req.body as any;

    await prisma.$transaction(async (tx) => {
      await tx.garrison.createMany({ data: body.garrisons ?? [] });
      await tx.user.createMany({ data: body.users ?? [] });
      await tx.membership.createMany({ data: body.memberships ?? [] });
      await tx.project.createMany({ data: body.projects ?? [] });
      await tx.phase.createMany({ data: body.phases ?? [] });
      await tx.component.createMany({ data: body.components ?? [] });
      await tx.task.createMany({ data: body.tasks ?? [] });
      await tx.vendorResource.createMany({ data: body.vendorResources ?? [] });
      await tx.taskImage.createMany({ data: body.taskImages ?? [] });
      await tx.userCostume.createMany({ data: body.userCostumes ?? [] });
      await tx.event.createMany({ data: body.events ?? [] });
      await tx.eventSignup.createMany({ data: body.eventSignups ?? [] });
    });

    return { restored: true };
  });
}
