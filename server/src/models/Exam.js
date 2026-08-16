import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String, default: '' },
    semester: { type: Number, default: 1, index: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, default: '10:00' },
    endTime: { type: String, default: '13:00' },
    room: { type: String, default: '' },
    maxMarks: { type: Number, default: 100 },
    type: { type: String, enum: ['quiz', 'midterm', 'final', 'practical', 'other'], default: 'midterm' },
  },
  { timestamps: true }
);

export const Exam = mongoose.model('Exam', examSchema);
