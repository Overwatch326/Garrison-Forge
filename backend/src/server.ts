import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import jwt from '@fastify/jwt';
import { execSync } from 'child_process';
import { registerProjectRoutes } from './routes/projects';
import { registerAuthRoutes } from './routes/auth';
import { registerEventRoutes } from './routes/events';
import { registerUserRoutes } from './routes/users';
import { registerAdminRoutes } from './routes/admin';

const server = Fastify({
  logger: true,
});

async function buildServer() {
  await server.register(cors, {
    origin: (origin, cb) => {
      // Allow all origins in production for now; you can tighten this later
      cb(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await server.register(sensible);
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  });

  server.get('/health', async () => {
    return { status: 'ok', service: 'garrison-forge-backend' };
  });

  await registerAuthRoutes(server);
  await registerProjectRoutes(server);
  await registerEventRoutes(server);
  await registerUserRoutes(server);
  await registerAdminRoutes(server);

  return server;
}

function ensureDatabase() {
  try {
    console.log('Ensuring database schema with Prisma db push...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('Prisma db push completed.');
  } catch (err) {
    console.error('Prisma db push failed:', err);
  }
}

async function start() {
  try {
    ensureDatabase();
    await buildServer();
    const port = Number(process.env.PORT || 4000);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Backend listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Start the server when this module is executed
start().catch((err) => {
  server.log.error(err);
  process.exit(1);
});

export { buildServer };
