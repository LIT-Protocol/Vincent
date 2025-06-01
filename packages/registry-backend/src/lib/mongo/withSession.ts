import mongoose from 'mongoose';

export async function withSession<T>(
  callback: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  const mongoSession = await mongoose.startSession();
  try {
    return await callback(mongoSession);
  } finally {
    try {
      await mongoSession.endSession();
    } catch {
      /* Ending a session error is not a critical error. */
    }
  }
}
