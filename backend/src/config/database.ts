import mongoose from 'mongoose';
import { config } from './env';
import { User, Campaign, Submission } from '../models';

let connection: Promise<typeof mongoose> | undefined;

export function connectDatabase() {
  if (!connection) {
    connection = mongoose
      .connect(config.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      })
      .then(async (database) => {
        // Unique indexes must exist before accepting writes on a fresh database.
        await Promise.all([User.init(), Campaign.init(), Submission.init()]);
        return database;
      })
      .catch((error: unknown) => {
        connection = undefined;
        throw error;
      });
  }
  return connection;
}
