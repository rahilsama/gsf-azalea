import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};

if (!env.databaseUrl) {
  // Fail fast in production-like environments
  if (env.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.warn('DATABASE_URL is not set. Prisma will fail to connect.');
  }
}

if (!env.jwtSecret) {
  // eslint-disable-next-line no-console
  console.warn('JWT_SECRET is not set. Authentication will not work correctly.');
}

