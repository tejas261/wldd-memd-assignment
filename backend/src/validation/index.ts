import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID.');
const email = z.string().trim().email('Enter a valid email address.').max(254).toLowerCase();
const password = z
  .string()
  .min(8, 'Use at least 8 characters for your password.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes.');

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
    email,
    password,
    role: z.enum(['brand', 'creator']),
  })
  .strict();
export const loginSchema = z.object({ email, password: z.string().min(1).max(200) }).strict();

const money = z.number().int('Amounts must be whole rupees.').positive().max(1_000_000_000);
export const campaignSchema = z
  .object({
    name: z.string().trim().min(3, 'Campaign name must be at least 3 characters.').max(100),
    platform: z.enum(['instagram', 'youtube']),
    budget: money,
    milestones: z
      .array(
        z
          .object({ views: z.number().int().positive().max(1_000_000_000_000), payout: money })
          .strict(),
      )
      .min(1)
      .max(10),
  })
  .strict()
  .superRefine((value, ctx) => {
    const sorted = [...value.milestones].sort((a, b) => a.views - b.views);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].payout > value.budget) {
        ctx.addIssue({
          code: 'custom',
          path: ['milestones'],
          message: 'A milestone payout cannot exceed the campaign budget.',
        });
      }
      if (
        i > 0 &&
        (sorted[i].views === sorted[i - 1].views || sorted[i].payout <= sorted[i - 1].payout)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['milestones'],
          message: 'View thresholds must be unique, and payouts must increase with views.',
        });
      }
    }
  })
  .transform((value) => ({
    ...value,
    milestones: [...value.milestones].sort((a, b) => a.views - b.views),
  }));

export const submitSchema = z
  .object({ campaignId: objectId, postUrl: z.string().url('Enter a valid post URL.').max(2048) })
  .strict();
export const viewsSchema = z
  .object({ views: z.number().int().min(0).max(1_000_000_000_000) })
  .strict();
export const pageSchema = z
  .object({
    page: z.coerce.number().int().positive().max(100_000).default(1),
    limit: z.coerce.number().int().positive().max(50).default(12),
  })
  .strict();
