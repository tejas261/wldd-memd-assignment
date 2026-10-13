import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { config } from '../config/env';
import { signup, login, signToken } from '../services/auth';
import { signupSchema, loginSchema } from '../validation';

const router = Router();
const cookieOptions = {
  httpOnly: true,
  secure: config.COOKIE_SECURE ? config.COOKIE_SECURE === 'true' : config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => config.NODE_ENV === 'test',
  message: {
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' },
  },
});

router.post('/signup', authLimiter, async (req, res) => {
  const user = await signup(signupSchema.parse(req.body));
  res
    .cookie('session', signToken(user), { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .status(201)
    .json({ user });
});
router.post('/login', authLimiter, async (req, res) => {
  const user = await login(loginSchema.parse(req.body));
  res
    .cookie('session', signToken(user), { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json({ user });
});
router.post('/logout', (_req, res) => {
  res.clearCookie('session', cookieOptions).status(204).end();
});
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
