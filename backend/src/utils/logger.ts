import pino from 'pino';
import { config } from '../config/env';

export const logger = pino({ level: config.NODE_ENV === 'test' ? 'silent' : config.LOG_LEVEL });
