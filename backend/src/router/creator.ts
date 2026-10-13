import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { creatorSummary } from '../services/submissions';
import { pageSchema } from '../validation';

const router = Router();

router.get('/summary', authenticate, requireRole('creator'), async (req, res) => {
  const { page, limit } = pageSchema.parse(req.query);
  res.json(await creatorSummary(req.user!.id, page, limit));
});

export default router;
