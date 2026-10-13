import app from './app';
import { connectDatabase } from './config/database';
import { config } from './config/env';
import { logger } from './utils/logger';
import mongoose from 'mongoose';

async function main() {
  await connectDatabase();
  const server = app.listen(config.PORT, () => logger.info({ port: config.PORT }, 'API listening'));
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      server.close(() => {
        void mongoose.disconnect().then(() => process.exit(0));
      });
    });
  }
}
main().catch(() => {
  logger.fatal('Could not start API. Check environment and database connectivity.');
  process.exit(1);
});
