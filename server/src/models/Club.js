import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'technical' },
    logo: { type: String, default: '' },
    facultyAdvisor: { type: String, default: '' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    announcements: [
      {
        title: { type: String, required: true },
        content: { type: String, default: '' },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Club = mongoose.model('Club', clubSchema);
