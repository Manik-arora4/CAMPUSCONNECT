import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subjectName: { type: String, default: '' },
    semester: { type: Number, default: 1 },
    url: { type: String, default: '' },
    type: { type: String, enum: ['pdf', 'link', 'notes', 'video', 'other'], default: 'pdf' },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

export const Resource = mongoose.model('Resource', resourceSchema);
