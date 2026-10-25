import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  if (!uri) throw new Error('Set MONGODB_URI in backend/.env or in the hosting environment.');
  return mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    autoIndex: true,
    // Fail a request promptly instead of silently buffering during outages.
    bufferCommands: false,
  }).asPromise();
}
