import { deleteBackupSchema, uploadBackupSchema, validateBody } from './diary.request.js';
import { deleteBackup, getBackup, getStatus, putBackup } from './diary.service.js';

export function createDiaryController({ models }) {
  return {
    async status(req, res) { res.json({ data: await getStatus(models, req.auth.user._id) }); },
    async get(req, res) { res.json({ data: await getBackup(models, req.auth.user._id) }); },
    async put(req, res) { res.json({ data: await putBackup(models, req.auth.user._id, validateBody(uploadBackupSchema, req.body)) }); },
    async delete(req, res) { res.json({ data: await deleteBackup(models, req.auth.user._id, validateBody(deleteBackupSchema, req.body)) }); },
  };
}
