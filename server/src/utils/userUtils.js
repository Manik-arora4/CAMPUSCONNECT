import bcrypt from 'bcryptjs';

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(candidate, hashed) {
  return bcrypt.compare(candidate, hashed);
}

/**
 * Strip sensitive fields and expose the same shape the Mongoose
 * `toSafeJSON()` method returned (client code reads `user.id`).
 */
export function toSafeUser(u) {
  if (!u) return null;
  const { password, resetToken, resetTokenExpiry, verificationToken, ...rest } = u;
  return {
    id: u.id,
    _id: u.id,
    ...rest,
  };
}
