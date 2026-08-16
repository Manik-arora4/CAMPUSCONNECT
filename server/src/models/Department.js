import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

departmentSchema.index({ college: 1, name: 1 }, { unique: true });
export const Department = mongoose.model('Department', departmentSchema);
