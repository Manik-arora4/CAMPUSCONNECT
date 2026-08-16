import mongoose from 'mongoose';

const timetableSlotSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String, required: true, trim: true },
    teacherName: { type: String, default: '' },
    room: { type: String, default: '' },
    day: { type: Number, required: true, min: 0, max: 6, index: true }, // 0 = Sunday
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    color: { type: String, default: '#6366f1' },
    type: { type: String, enum: ['class', 'lab', 'free', 'other'], default: 'class' },
  },
  { timestamps: true }
);

timetableSlotSchema.index({ student: 1, day: 1, startTime: 1 });
export const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema);
