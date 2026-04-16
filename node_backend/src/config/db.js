import mongoose from 'mongoose';

let connected = false;

export async function connectDb() {
  if (connected) return mongoose.connection;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(uri, {
    autoIndex: true,
  });
  connected = true;
  return mongoose.connection;
}
