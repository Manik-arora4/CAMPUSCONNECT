import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['internship', 'hackathon', 'job', 'scholarship', 'training', 'workshop', 'competition', 'fellowship', 'research', 'conference'],
      required: true,
      index: true,
    },
    description: { type: String, default: '' },
    skillsRequired: { type: [String], default: [] },
    eligibility: { type: String, default: '' },
    courseRestrictions: { type: [String], default: [] },
    experienceLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'any'], default: 'any' },
    location: { type: String, default: 'Remote' },
    mode: { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'remote', index: true },
    stipend: { type: String, default: '' },
    prize: { type: String, default: '' },
    deadline: { type: Date, required: true, index: true },
    postedDate: { type: Date, default: Date.now },
    applyLink: { type: String, default: '' },
    requirements: { type: [String], default: [] },
    applicationProcess: { type: String, default: '' },
    tags: { type: [String], default: [] },
    source: { type: String, default: 'admin' }, // admin | api | feed
    externalId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired', 'archived'],
      default: 'pending',
      index: true,
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

opportunitySchema.index({ category: 1, status: 1, deadline: 1 });
opportunitySchema.index({ skillsRequired: 1 });
export const Opportunity = mongoose.model('Opportunity', opportunitySchema);
