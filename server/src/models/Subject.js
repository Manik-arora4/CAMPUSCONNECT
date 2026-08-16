import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    semester: { type: Number, default: 1, index: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    color: { type: String, default: '#6366f1' },
    credits: { type: Number, default: 3 },
  },
  { timestamps: true }
);

export const Subject = mongoose.model('Subject', subjectSchema);
