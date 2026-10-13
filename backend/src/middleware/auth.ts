import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from '../utils/errors';
import { getUser, type SessionUser } from '../services/auth';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  const token: unknown = bearer ?? req.cookies?.session;
  if (typeof token !== 'string')
    throw new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
  let subject: string;
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'memed',
    });
    if (typeof payload === 'string' || !payload.sub || !/^[a-f\d]{24}$/i.test(payload.sub))
      throw new Error('Invalid subject');
    subject = payload.sub;
  } catch {
    throw new AppError(401, 'UNAUTHENTICATED', 'Your session has expired. Please log in again.');
  }
  req.user = await getUser(subject);
  next();
};

export function requireRole(role: SessionUser['role']): RequestHandler {
  return (req, _res, next) => {
    if (req.user?.role !== role)
      throw new AppError(403, 'FORBIDDEN', `This action is only available to ${role}s.`);
    next();
  };
}
