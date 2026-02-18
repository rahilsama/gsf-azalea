import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { loggingMiddleware } from './middleware/logging';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(loggingMiddleware);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

