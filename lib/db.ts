import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Reuse the connection across hot-reloads / serverless invocations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForMongoose = global as any;

const cache: MongooseCache = globalForMongoose.mongoose ?? { conn: null, promise: null };
globalForMongoose.mongoose = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env.local file (see .env.example)."
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
