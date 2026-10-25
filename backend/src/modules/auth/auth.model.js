import mongoose from 'mongoose';

export function createAuthModels(connection) {
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 32, match: /^[a-z0-9_]+$/ },
    passwordHash: { type: String, required: true, select: false },
    passwordSalt: { type: String, required: true, select: false },
    backup: { type: mongoose.Schema.Types.Mixed, default: undefined, select: false },
    backupRevision: { type: Number, default: 0, min: 0 },
    backupUpdatedAt: { type: Date, default: null },
  }, { timestamps: true, versionKey: false, strict: 'throw' });
  const sessionSchema = new mongoose.Schema({
    tokenHash: { type: String, required: true, unique: true, select: false },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    csrfToken: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  }, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, strict: 'throw' });
  return {
    User: connection.models.User || connection.model('User', userSchema),
    Session: connection.models.Session || connection.model('Session', sessionSchema),
  };
}
