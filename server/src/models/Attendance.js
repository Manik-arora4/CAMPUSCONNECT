import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', index: true },
    subjectName: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: ['present', 'absent', 'holiday'], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
export const Attendance = mongoose.model('Attendance', attendanceSchema);
