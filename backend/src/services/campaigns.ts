import type { z } from 'zod';
import { Types } from 'mongoose';
import { Campaign, Submission } from '../models';
import { AppError, isDuplicate } from '../utils/errors';
import type { campaignSchema, pageSchema } from '../validation';
import type { SessionUser } from './auth';

type CampaignInput = z.infer<typeof campaignSchema>;

export async function createCampaign(brand: string, input: CampaignInput, requestKey: string) {
  const existing = await Campaign.findOne({ brand, requestKey });
  if (existing) {
    const matches =
      existing.name === input.name &&
      existing.platform === input.platform &&
      existing.budget === input.budget &&
      JSON.stringify(existing.milestones.map((m) => ({ views: m.views, payout: m.payout }))) ===
        JSON.stringify(input.milestones);
    if (!matches)
      throw new AppError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'This request key was already used for a different campaign.',
      );
    return { campaign: existing, created: false };
  }
  try {
    return { campaign: await Campaign.create({ ...input, brand, requestKey }), created: true };
  } catch (error) {
    if (isDuplicate(error)) return createCampaign(brand, input, requestKey);
    throw error;
  }
}

export async function listCampaigns(user: SessionUser, pagination: z.infer<typeof pageSchema>) {
  // A campaign is live as long as there is budget left. Owners can still see exhausted ones.
  const filter =
    user.role === 'brand' ? { brand: user.id } : { $expr: { $lt: ['$spent', '$budget'] } };
  const [campaigns, total] = await Promise.all([
    Campaign.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .select('-requestKey -__v')
      .lean(),
    Campaign.countDocuments(filter),
  ]);
  const [summary] =
    user.role === 'brand'
      ? await Campaign.aggregate<{ budget: number; spent: number; count: number }>([
          { $match: { brand: new Types.ObjectId(user.id) } },
          {
            $group: {
              _id: null,
              budget: { $sum: '$budget' },
              spent: { $sum: '$spent' },
              count: { $sum: 1 },
            },
          },
        ])
      : [];
  return {
    campaigns,
    total,
    ...pagination,
    ...(user.role === 'brand' ? { summary: summary ?? { budget: 0, spent: 0, count: 0 } } : {}),
  };
}

export async function campaignSubmissions(
  id: string,
  brand: string,
  pagination: z.infer<typeof pageSchema>,
) {
  if (!(await Campaign.exists({ _id: id, brand })))
    throw new AppError(404, 'NOT_FOUND', 'Campaign not found.');
  const [submissions, total] = await Promise.all([
    Submission.find({ campaign: id })
      .populate('creator', 'name')
      .sort({ createdAt: -1, _id: -1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean(),
    Submission.countDocuments({ campaign: id }),
  ]);
  return { submissions, total, ...pagination };
}
