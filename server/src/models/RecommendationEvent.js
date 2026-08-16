import mongoose from 'mongoose';

const recommendationEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['viewed', 'saved', 'applied', 'dismissed', 'not-interested', 'searched', 'clicked'],
      required: true,
    },
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', index: true },
    category: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

recommendationEventSchema.index({ user: 1, type: 1, createdAt: -1 });
export const RecommendationEvent = mongoose.model('RecommendationEvent', recommendationEventSchema);
