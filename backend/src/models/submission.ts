import { Schema, model } from 'mongoose';

const submissionSchema = new Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postUrl: { type: String, required: true },
    views: { type: Number, required: true, default: 0, min: 0 },
    payout: { type: Number, required: true, default: 0, min: 0 },
    eligiblePayout: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);
submissionSchema.index({ campaign: 1, creator: 1 }, { unique: true });
submissionSchema.index({ campaign: 1, postUrl: 1 }, { unique: true });
submissionSchema.index({ creator: 1, createdAt: -1 });

export const Submission = model('Submission', submissionSchema);
