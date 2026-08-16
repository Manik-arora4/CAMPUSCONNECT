import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student', index: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', index: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    onboarded: { type: Boolean, default: false },
    designation: { type: String, default: '' }, // faculty designation
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    college: this.college,
    avatar: this.avatar,
    phone: this.phone,
    emailVerified: this.emailVerified,
    active: this.active,
    onboarded: this.onboarded,
    designation: this.designation,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  };
};

export const User = mongoose.model('User', userSchema);
