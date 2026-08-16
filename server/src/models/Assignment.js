import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', index: true },
    subjectName: { type: String, default: '' },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    semester: { type: Number, default: 1, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['assignment', 'project', 'exam-prep', 'other'], default: 'assignment' },
    dueDate: { type: Date, required: true, index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    maxMarks: { type: Number, default: 100 },
    attachments: { type: [String], default: [] },
    // per-student status tracking
    submissions: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'submitted', 'graded'], default: 'pending' },
        submittedAt: { type: Date },
        marks: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);
