import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './prisma/client';

const app = createApp();
const server = createServer(app);

const start = async () => {
  try {
    await prisma.$connect();
    server.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${env.port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

void start();

