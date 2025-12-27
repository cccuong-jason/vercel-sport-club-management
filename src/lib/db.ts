import mongoose from 'mongoose'

function resolveMongoUri() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL
  return uri || 'mongodb://127.0.0.1:27017'
}

let cached = (global as any).mongoose
if (!cached) cached = (global as any).mongoose = { conn: null as any, promise: null as any }

export async function connectDB() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    const uri = resolveMongoUri()
    const opts = { dbName: 'footballclub', serverSelectionTimeoutMS: 5000 }
    cached.promise = (async () => {
      let lastErr: any
      console.log(`[DB] Connecting to MongoDB at ${uri}`)
      for (let i = 0; i < 5; i++) {
        try {
          const conn = await mongoose.connect(uri, opts as any)
          console.log('[DB] Connected successfully')
          return conn
        } catch (e) {
          console.error(`[DB] Connection attempt ${i + 1} failed:`, e)
          lastErr = e
          await new Promise((r) => setTimeout(r, 500 * (i + 1)))
        }
      }
      console.error('[DB] All connection attempts failed')
      throw lastErr
    })()
  }
  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    cached.conn = null
    throw err
  }
  return cached.conn
}
