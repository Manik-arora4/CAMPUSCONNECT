import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, unique: true, uppercase: true, trim: true },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    website: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    establishedYear: { type: Number },
    logo: { type: String, default: '' },
  },
  { timestamps: true }
);

export const College = mongoose.model('College', collegeSchema);
