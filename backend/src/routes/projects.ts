import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function registerProjectRoutes(app: FastifyInstance) {
  // List all projects for now (later we will scope by user/garrison).
  app.get('/projects', async () => {
    const projects = await prisma.project.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: {
        phases: true,
        components: true,
      },
    });
    return { projects };
  });

  // Create a project (very naive for now).
  app.post('/projects', async (req, reply) => {
    const body = req.body as {
      name?: string;
      costumeType?: string;
      ownerId?: string;
      garrisonId?: string;
    };

    if (!body.name || !body.ownerId || !body.garrisonId) {
      return reply.badRequest('name, ownerId, and garrisonId are required');
    }

    const project = await prisma.project.create({
      data: {
        name: body.name,
        costumeType: body.costumeType,
        ownerId: body.ownerId,
        garrisonId: body.garrisonId,
      },
    });

    // Create some default phases for this project to support build lifecycles
    const defaultPhases = [
      'Research & Reference',
      'Planning & Sourcing',
      'Fabrication / 3D Printing',
      'Assembly & Fitting',
      'Finishing / Weathering',
      'Approval & First Troop',
    ];

    await prisma.phase.createMany({
      data: defaultPhases.map((name, index) => ({
        name,
        order: index,
        projectId: project.id,
      })),
    });

    return { project };
  });

  // Get tasks for a project, including phases and components
  app.get('/projects/:id/tasks', async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        phases: true,
        components: true,
      },
    });
    if (!project) {
      return reply.notFound('Project not found');
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        vendors: true,
        images: true,
      },
    });

    return { project, tasks };
  });

  // Create a task in a project
  app.post('/projects/:id/tasks', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { title?: string; phaseId?: string; componentId?: string };

    if (!body.title) {
      return reply.badRequest('title is required');
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return reply.notFound('Project not found');
    }

    const task = await prisma.task.create({
      data: {
        title: body.title,
        projectId: id,
        status: 'research',
        phaseId: body.phaseId,
        componentId: body.componentId,
      },
    });

    return { task };
  });

  // Create a vendor resource for a task
  app.post('/tasks/:taskId/vendors', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const body = req.body as {
      name?: string;
      website?: string;
      part?: string;
      cost?: number;
      color?: string;
      notesHtml?: string;
    };

    if (!body.name) {
      return reply.badRequest('name is required');
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return reply.notFound('Task not found');
    }

    const vendor = await prisma.vendorResource.create({
      data: {
        name: body.name,
        website: body.website,
        part: body.part,
        cost: body.cost,
        color: body.color,
        notesHtml: body.notesHtml,
        taskId,
      },
    });

    return { vendor };
  });

  // Delete a vendor resource
  app.delete('/vendors/:vendorId', async (req, reply) => {
    const { vendorId } = req.params as { vendorId: string };
    const existing = await prisma.vendorResource.findUnique({ where: { id: vendorId } });
    if (!existing) {
      return reply.notFound('Vendor not found');
    }
    await prisma.vendorResource.delete({ where: { id: vendorId } });
    return { ok: true };
  });

  // Create a task image (original photo)
  app.post('/tasks/:taskId/images', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const body = req.body as {
      dataUrl?: string;
      caption?: string;
    };

    if (!body.dataUrl) {
      return reply.badRequest('dataUrl is required');
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return reply.notFound('Task not found');
    }

    const image = await prisma.taskImage.create({
      data: {
        originalUrl: body.dataUrl,
        caption: body.caption,
        taskId,
      },
    });

    return { image };
  });

  // Upload a branding logo (stored similarly to task images for now)
  app.post('/branding/logo', async (req, reply) => {
    const body = req.body as {
      dataUrl?: string;
      kind?: 'primary' | 'secondary';
    };

    if (!body.dataUrl) {
      return reply.badRequest('dataUrl is required');
    }

    // For now we just echo back the dataUrl so the frontend can use it directly.
    // In a more advanced setup, this would persist to disk or object storage.
    return {
      url: body.dataUrl,
      kind: body.kind ?? 'primary',
    };
  });

  // Update a task image (e.g., annotated version, caption)
  app.patch('/images/:imageId', async (req, reply) => {
    const { imageId } = req.params as { imageId: string };
    const body = req.body as {
      annotatedDataUrl?: string;
      caption?: string;
    };

    const existing = await prisma.taskImage.findUnique({ where: { id: imageId } });
    if (!existing) {
      return reply.notFound('Image not found');
    }

    const image = await prisma.taskImage.update({
      where: { id: imageId },
      data: {
        annotatedUrl: body.annotatedDataUrl ?? existing.annotatedUrl,
        caption: body.caption ?? existing.caption,
      },
    });

    return { image }; 
  });

  // Create a phase for a project
  app.post('/projects/:id/phases', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { name?: string; order?: number };

    if (!body.name) {
      return reply.badRequest('name is required');
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return reply.notFound('Project not found');
    }

    const phaseCount = await prisma.phase.count({ where: { projectId: id } });
    const phase = await prisma.phase.create({
      data: {
        name: body.name,
        order: body.order ?? phaseCount,
        projectId: id,
      },
    });

    return { phase };
  });

  // Update a project (e.g., close/archive)
  app.patch('/projects/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { status?: string };

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return reply.notFound('Project not found');
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
      },
    });

    return { project };
  });

  // Create a component for a project
  app.post('/projects/:id/components', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      name?: string;
      type?: string;
      sourceType?: string;
    };

    if (!body.name) {
      return reply.badRequest('name is required');
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return reply.notFound('Project not found');
    }

    const component = await prisma.component.create({
      data: {
        name: body.name,
        type: body.type || 'armor-piece',
        sourceType: body.sourceType || 'unknown',
        status: 'not-started',
        projectId: id,
      },
    });

    return { component };
  });

  // Delete a task image
  app.delete('/images/:imageId', async (req, reply) => {
    const { imageId } = req.params as { imageId: string };
    const existing = await prisma.taskImage.findUnique({ where: { id: imageId } });
    if (!existing) {
      return reply.notFound('Image not found');
    }
    await prisma.taskImage.delete({ where: { id: imageId } });
    return { ok: true };
  });

  // Update a task (status, description, includeInThread, hours, component/phase)
  app.patch('/tasks/:taskId', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const body = req.body as {
      status?: string;
      descriptionHtml?: string | null;
      includeInThread?: boolean;
      hours?: number | null;
      componentId?: string | null;
      phaseId?: string | null;
    };

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      return reply.notFound('Task not found');
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: body.status ?? existing.status,
        descriptionHtml: body.descriptionHtml ?? existing.descriptionHtml,
        includeInThread:
          typeof body.includeInThread === 'boolean'
            ? body.includeInThread
            : existing.includeInThread,
        hours: typeof body.hours === 'number' ? body.hours : existing.hours,
        componentId:
          typeof body.componentId === 'string' || body.componentId === null
            ? body.componentId
            : existing.componentId,
        phaseId:
          typeof body.phaseId === 'string' || body.phaseId === null
            ? body.phaseId
            : existing.phaseId,
      },
    });

    return { task };
  });
}
