import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true },
    status: {
      type: String,
      enum: ['saved', 'planning', 'applied', 'shortlisted', 'interview', 'selected', 'rejected'],
      default: 'saved',
      index: true,
    },
    notes: { type: String, default: '' },
    appliedDate: { type: Date },
    timeline: [
      {
        status: { type: String },
        at: { type: Date, default: Date.now },
      },
    ],
    aiAssist: {
      coverLetter: { type: String, default: '' },
      introduction: { type: String, default: '' },
      whyYou: { type: String, default: '' },
      generatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

applicationSchema.index({ student: 1, opportunity: 1 }, { unique: true });
export const Application = mongoose.model('Application', applicationSchema);
