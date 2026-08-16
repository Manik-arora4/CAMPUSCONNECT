import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, default: 'application/pdf' },
    fileSize: { type: Number, default: 0 },
    extractedText: { type: String, default: '' },
    analysis: {
      score: { type: Number },
      parsed: {
        education: { type: [String], default: [] },
        skills: { type: [String], default: [] },
        projects: { type: [String], default: [] },
        experience: { type: [String], default: [] },
        certifications: { type: [String], default: [] },
      },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      missingSkills: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      atsFriendly: { type: Boolean },
      generatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

export const Resume = mongoose.model('Resume', resumeSchema);
