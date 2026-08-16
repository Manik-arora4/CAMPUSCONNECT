import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      deadlineReminders: { type: Boolean, default: true },
      collegeAnnouncements: { type: Boolean, default: true },
      aiRecommendations: { type: Boolean, default: true },
      attendanceAlerts: { type: Boolean, default: true },
    },
    defaultView: { type: String, default: 'dashboard' },
    weeklyDigest: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);
