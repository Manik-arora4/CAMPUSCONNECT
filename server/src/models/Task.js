import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subject: { type: String, default: '' },
    category: { type: String, enum: ['study', 'assignment', 'project', 'exam-prep', 'career', 'personal'], default: 'study' },
    dueDate: { type: Date, index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo', index: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, status: 1 });
export const Task = mongoose.model('Task', taskSchema);
