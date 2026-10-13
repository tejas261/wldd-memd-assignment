import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { z } from 'zod';
import { User } from '../models';
import { config } from '../config/env';
import { AppError, isDuplicate } from '../utils/errors';
import type { signupSchema, loginSchema } from '../validation';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'brand' | 'creator';
}

function publicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
}): SessionUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as SessionUser['role'],
  };
}

export function signToken(user: SessionUser): string {
  return jwt.sign({ role: user.role }, config.JWT_SECRET, {
    subject: user.id,
    expiresIn: '7d',
    algorithm: 'HS256',
    issuer: 'memed',
  });
}

export async function signup(input: z.infer<typeof signupSchema>) {
  try {
    const user = await User.create({
      ...input,
      passwordHash: await bcrypt.hash(input.password, 12),
    });
    return publicUser(user);
  } catch (error) {
    if (isDuplicate(error))
      throw new AppError(
        409,
        'EMAIL_IN_USE',
        'An account with this email already exists. Try logging in.',
      );
    throw error;
  }
}

// A valid hash keeps invalid-email logins on roughly the same path as invalid passwords.
const dummyHash = bcrypt.hashSync('not-a-real-account-password', 12);
export async function login(input: z.infer<typeof loginSchema>) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? dummyHash);
  if (!user || !valid)
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  return publicUser(user);
}

export async function getUser(id: string) {
  const user = await User.findById(id);
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Please log in again.');
  return publicUser(user);
}
