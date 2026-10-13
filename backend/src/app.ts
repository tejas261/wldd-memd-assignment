import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { config } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { AppError } from './utils/errors';
import { errorHandler } from './middleware/error-handler';
import { router } from './router';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  pinoHttp({
    logger,
    genReqId: () => randomUUID(),
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin && origin !== new URL(config.FRONTEND_URL).origin)
      throw new AppError(403, 'INVALID_ORIGIN', 'Request origin is not allowed.');
    if (!req.is('application/json'))
      throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Use Content-Type: application/json.');
  }
  next();
});
app.get('/api/health', async (_req, res) => {
  try {
    const db = await connectDatabase();
    await db.connection.db!.admin().ping();
    res.json({ status: 'ok' });
  } catch {
    res
      .status(503)
      .json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is unavailable.' } });
  }
});
app.use(
  '/api',
  async (_req, _res, next) => {
    await connectDatabase();
    next();
  },
  router,
);
app.use((_req, _res) => {
  throw new AppError(404, 'NOT_FOUND', 'Endpoint not found.');
});
app.use(errorHandler);
export default app;
