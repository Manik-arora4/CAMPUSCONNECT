import mongoose from 'mongoose';

const planItemSchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['class', 'task', 'break', 'study', 'career', 'free', 'other'], default: 'other' },
    status: { type: String, enum: ['pending', 'completed', 'snoozed', 'dismissed'], default: 'pending' },
    source: { type: String, default: '' }, // e.g. 'assignment:5f...', 'opportunity:...', 'timetable:...'
  },
  { _id: false }
);

const aiPlanSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    title: { type: String, default: 'Your AI Daily Plan' },
    items: { type: [planItemSchema], default: [] },
    summary: { type: String, default: '' },
    source: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    accepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

aiPlanSchema.index({ student: 1, date: 1 }, { unique: true });
export const AIPlan = mongoose.model('AIPlan', aiPlanSchema);
