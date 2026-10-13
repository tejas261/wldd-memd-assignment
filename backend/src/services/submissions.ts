import mongoose from 'mongoose';
import { Campaign, Submission } from '../models';
import { AppError, isDuplicate } from '../utils/errors';
import { normalizePostUrl } from '../utils/post-url';
import { calculateIncrement, calculatePayout } from '../utils/payout';
import { logger } from '../utils/logger';

export async function submitPost(creator: string, campaignId: string, rawUrl: string) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found.');
  const postUrl = normalizePostUrl(rawUrl, campaign.platform);
  const existing = await Submission.findOne({ campaign: campaignId, creator });
  if (existing) {
    if (existing.postUrl !== postUrl)
      throw new AppError(409, 'ALREADY_SUBMITTED', 'You already have a post in this campaign.');
    return { submission: existing, created: false };
  }
  if (campaign.spent >= campaign.budget)
    throw new AppError(409, 'BUDGET_EXHAUSTED', 'This campaign has used its budget.');
  try {
    return {
      submission: await Submission.create({ campaign: campaignId, creator, postUrl }),
      created: true,
    };
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    const duplicate = await Submission.findOne({ campaign: campaignId, creator, postUrl });
    if (duplicate) return { submission: duplicate, created: false };
    throw new AppError(
      409,
      'ALREADY_SUBMITTED',
      'This creator or post already has a submission in the campaign.',
    );
  }
}

export async function updateViews(id: string, reportedViews: number) {
  const result = await mongoose.connection.transaction(
    async (session) => {
      // Re-read both documents on every transaction retry; never carry a stale delta into the retry.
      const submission = await Submission.findById(id).session(session);
      if (!submission) throw new AppError(404, 'NOT_FOUND', 'Submission not found.');
      const campaign = await Campaign.findById(submission.campaign).session(session);
      if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found.');

      const views = Math.max(submission.views, reportedViews);
      const eligiblePayout = calculatePayout(views, campaign.milestones);
      const paidNow = calculateIncrement(
        eligiblePayout,
        submission.payout,
        campaign.budget - campaign.spent,
      );
      submission.views = views;
      submission.eligiblePayout = eligiblePayout;
      submission.payout += paidNow;

      if (paidNow > 0) {
        // Updating the shared campaign document makes competing transactions conflict and retry.
        const updated = await Campaign.updateOne(
          {
            _id: campaign._id,
            spent: campaign.spent,
            $expr: { $lte: [{ $add: ['$spent', paidNow] }, '$budget'] },
          },
          { $inc: { spent: paidNow } },
          { session },
        );
        if (updated.modifiedCount !== 1)
          throw new AppError(
            409,
            'RETRY_UPDATE',
            'Campaign changed. Please retry the view update.',
          );
      }
      await submission.save({ session });
      return {
        submission: submission.toObject(),
        paidNow,
        remainingBudget: campaign.budget - campaign.spent - paidNow,
      };
    },
    {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      maxCommitTimeMS: 10_000,
    },
  );
  logger.info({ submissionId: id, paidNow: result.paidNow }, 'views reconciled');
  return result;
}

export async function creatorSummary(creator: string, page: number, limit: number) {
  const [submissions, totals] = await Promise.all([
    Submission.find({ creator })
      .populate('campaign', 'name platform budget spent milestones')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Submission.aggregate<{ totalEarnings: number; totalViews: number; total: number }>([
      { $match: { creator: new mongoose.Types.ObjectId(creator) } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$payout' },
          totalViews: { $sum: '$views' },
          total: { $sum: 1 },
        },
      },
    ]),
  ]);
  return {
    submissions,
    totalEarnings: totals[0]?.totalEarnings ?? 0,
    totalViews: totals[0]?.totalViews ?? 0,
    total: totals[0]?.total ?? 0,
    page,
    limit,
  };
}
