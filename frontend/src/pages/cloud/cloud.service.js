import { exportEncryptedBackup, importEncryptedBackup } from '../../services/storage.service.js';

// Only this encrypted wrapper crosses the network; the passphrase stays here.
export async function uploadEncryptedDiary(client, state, passphrase, expectedRevision) {
  const backup = JSON.parse(await exportEncryptedBackup(state, passphrase));
  return client.upload(backup, expectedRevision);
}

export async function decryptCloudDiary(client, passphrase) {
  const { backup } = await client.download();
  return importEncryptedBackup(JSON.stringify(backup), passphrase);
}
