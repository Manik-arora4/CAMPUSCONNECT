import mongoose from 'mongoose';

const aiSummarySchema = new mongoose.Schema(
  {
    summary: { type: String, default: '' },
    importantDates: { type: [String], default: [] },
    deadline: { type: String, default: '' },
    actionRequired: { type: String, default: '' },
    examDetails: { type: String, default: '' },
    generatedAt: { type: Date },
  },
  { _id: false }
);

const noticeSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, enum: ['general', 'exam', 'event', 'academic', 'holiday', 'fee', 'placement', 'other'], default: 'general', index: true },
    important: { type: Boolean, default: false },
    date: { type: Date, default: Date.now, index: true },
    expiryDate: { type: Date },
    attachments: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    aiSummary: { type: aiSummarySchema, default: null },
  },
  { timestamps: true }
);

export const Notice = mongoose.model('Notice', noticeSchema);
