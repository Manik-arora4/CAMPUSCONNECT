import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'general' },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, default: '10:00' },
    endTime: { type: String, default: '16:00' },
    location: { type: String, default: '' },
    organizer: { type: String, default: '' },
    registrationLink: { type: String, default: '' },
    registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);
