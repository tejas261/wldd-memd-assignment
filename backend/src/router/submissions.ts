import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { submitPost, updateViews } from '../services/submissions';
import { submitSchema, viewsSchema, objectId } from '../validation';

const router = Router();

router.post('/', authenticate, requireRole('creator'), async (req, res) => {
  const body = submitSchema.parse(req.body);
  const result = await submitPost(req.user!.id, body.campaignId, body.postUrl);
  res.status(result.created ? 201 : 200).json({ submission: result.submission });
});
// Any logged-in role can simulate a platform update, as requested by the brief.
router.patch('/:id/views', authenticate, async (req, res) => {
  res.json(await updateViews(objectId.parse(req.params.id), viewsSchema.parse(req.body).views));
});

export default router;
