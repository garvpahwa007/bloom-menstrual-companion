import { ApiError } from '../../utilities/api-error.js';

function requireUser(user) {
  if (!user) throw new ApiError(401, 'AUTH_REQUIRED', 'Sign in to use cloud backup.');
  return user;
}

function status(user) {
  return { hasBackup: Boolean(user.backupUpdatedAt), revision: user.backupRevision, updatedAt: user.backupUpdatedAt };
}

async function assertRevisionConflict(models, userId) {
  requireUser(await models.User.exists({ _id: userId }));
  throw new ApiError(409, 'BACKUP_CONFLICT', 'The cloud backup changed. Refresh its status before trying again.');
}

export async function getStatus(models, userId) {
  return status(requireUser(await models.User.findById(userId)));
}

export async function getBackup(models, userId) {
  const user = requireUser(await models.User.findById(userId).select('+backup'));
  if (!user.backup || !user.backupUpdatedAt) throw new ApiError(404, 'BACKUP_NOT_FOUND', 'This account has no cloud backup.');
  return { backup: user.backup, revision: user.backupRevision, updatedAt: user.backupUpdatedAt };
}

export async function putBackup(models, userId, { backup, expectedRevision }) {
  const user = await models.User.findOneAndUpdate({ _id: userId, backupRevision: expectedRevision }, {
    $set: { backup, backupUpdatedAt: new Date() }, $inc: { backupRevision: 1 },
  }, { new: true, runValidators: true });
  if (!user) return assertRevisionConflict(models, userId);
  return status(user);
}

export async function deleteBackup(models, userId, { expectedRevision }) {
  const user = await models.User.findOneAndUpdate({ _id: userId, backupRevision: expectedRevision }, {
    $unset: { backup: 1 }, $set: { backupUpdatedAt: null }, $inc: { backupRevision: 1 },
  }, { new: true, runValidators: true });
  if (!user) return assertRevisionConflict(models, userId);
  return status(user);
}
