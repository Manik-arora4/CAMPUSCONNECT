import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['college', 'academic', 'attendance', 'opportunity', 'career', 'ai', 'system'],
      default: 'system',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' },
    icon: { type: String, default: 'bell' },
    read: { type: Boolean, default: false, index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
export const Notification = mongoose.model('Notification', notificationSchema);
