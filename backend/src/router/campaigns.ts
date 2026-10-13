import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { createCampaign, listCampaigns, campaignSubmissions } from '../services/campaigns';
import { campaignSchema, objectId, pageSchema } from '../validation';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  res.json(await listCampaigns(req.user!, pageSchema.parse(req.query)));
});
router.post('/', authenticate, requireRole('brand'), async (req, res) => {
  const key = z
    .string()
    .uuid('Idempotency-Key must be a UUID.')
    .parse(req.get('Idempotency-Key') ?? randomUUID());
  const result = await createCampaign(req.user!.id, campaignSchema.parse(req.body), key);
  res.status(result.created ? 201 : 200).json({ campaign: result.campaign });
});
router.get('/:id/submissions', authenticate, requireRole('brand'), async (req, res) => {
  res.json(
    await campaignSubmissions(
      objectId.parse(req.params.id),
      req.user!.id,
      pageSchema.parse(req.query),
    ),
  );
});

export default router;
