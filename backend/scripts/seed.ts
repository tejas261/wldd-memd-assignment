import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/database';
import { User, Campaign, Submission } from '../src/models';
import { createCampaign } from '../src/services/campaigns';
import { submitPost, updateViews } from '../src/services/submissions';

async function seed() {
  await connectDatabase();
  await Promise.all([User.init(), Campaign.init(), Submission.init()]);
  const passwordHash = await bcrypt.hash('MemeDemo123!', 12);
  const brand = await User.findOneAndUpdate(
    { email: 'brand@memed.demo' },
    { $setOnInsert: { name: 'Studio Social', role: 'brand', passwordHash } },
    { upsert: true, returnDocument: 'after' },
  );
  const creator = await User.findOneAndUpdate(
    { email: 'creator@memed.demo' },
    { $setOnInsert: { name: 'Aanya', role: 'creator', passwordHash } },
    { upsert: true, returnDocument: 'after' },
  );
  const examples = [
    {
      name: 'The weekend is a mood',
      platform: 'instagram' as const,
      budget: 25000,
      milestones: [
        { views: 10000, payout: 500 },
        { views: 50000, payout: 2000 },
        { views: 100000, payout: 5000 },
      ],
    },
    {
      name: 'Main character energy',
      platform: 'youtube' as const,
      budget: 40000,
      milestones: [
        { views: 20000, payout: 1000 },
        { views: 75000, payout: 3500 },
        { views: 200000, payout: 8000 },
      ],
    },
    {
      name: 'For the group chat',
      platform: 'instagram' as const,
      budget: 15000,
      milestones: [
        { views: 5000, payout: 250 },
        { views: 25000, payout: 1000 },
        { views: 75000, payout: 3000 },
      ],
    },
  ];
  for (const [index, example] of examples.entries()) {
    const { campaign } = await createCampaign(
      brand._id.toString(),
      example,
      `demo-campaign-${index}`,
    );
    if (index === 0) {
      const { submission, created } = await submitPost(
        creator._id.toString(),
        campaign._id.toString(),
        'https://www.instagram.com/p/MemedDemo01/',
      );
      if (created) await updateViews(submission._id.toString(), 18000);
    }
  }
  console.log(
    'Demo accounts ready: brand@memed.demo and creator@memed.demo. Password: MemeDemo123!',
  );
  await mongoose.disconnect();
}
seed().catch(async () => {
  console.error('Seed failed. Check the database connection and existing demo records.');
  await mongoose.disconnect();
  process.exit(1);
});
