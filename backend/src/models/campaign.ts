import { Schema, model } from 'mongoose';

const milestoneSchema = new Schema(
  {
    views: { type: Number, required: true, min: 1 },
    payout: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const campaignSchema = new Schema(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    platform: { type: String, enum: ['instagram', 'youtube'], required: true },
    budget: { type: Number, required: true, min: 1 },
    spent: { type: Number, required: true, default: 0, min: 0 },
    milestones: { type: [milestoneSchema], required: true },
    requestKey: { type: String, required: true },
  },
  { timestamps: true },
);
campaignSchema.index({ brand: 1, createdAt: -1 });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ brand: 1, requestKey: 1 }, { unique: true });

export const Campaign = model('Campaign', campaignSchema);
