import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  { name: { type: String, required: true, trim: true }, level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' } },
  { _id: false }
);

const roadmapStepSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    status: { type: String, enum: ['Not Started', 'Learning', 'Completed'], default: 'Not Started' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', index: true },
    course: { type: String, default: '' },
    semester: { type: Number, default: 1 },
    section: { type: String, default: '' },
    enrollmentNumber: { type: String, default: '' },
    bio: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    skills: { type: [skillSchema], default: [] },
    interests: { type: [String], default: [] },
    careerGoal: { type: String, default: '' },
    roadmap: { type: [roadmapStepSchema], default: [] },
    preferredLocation: { type: String, default: '' },
    remotePreference: { type: String, enum: ['remote', 'onsite', 'hybrid', 'any'], default: 'any' },
    weeklyLearningHours: { type: Number, default: 10 },
    preferredOpportunityTypes: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  },
  { timestamps: true }
);

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
