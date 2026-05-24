import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

const SALT_ROUNDS = 10;

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const body = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!body.email || !body.password) {
      return reply.badRequest('email and password are required');
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.conflict('User already exists');
    }

    const hash = await bcrypt.hash(body.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: hash,
        displayName: body.displayName || null,
      },
    });

    const token = app.jwt.sign({ sub: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        legionId: user.legionId,
      },
    };
  });

  app.post('/auth/login', async (req, reply) => {
    const body = req.body as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return reply.badRequest('email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return reply.unauthorized('Invalid credentials');
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.unauthorized('Invalid credentials');
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        legionId: user.legionId,
      },
    };
  });
}
