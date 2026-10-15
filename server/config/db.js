import mongoose from 'mongoose';
import { env } from './env.js';
export async function connectDb(uri = env.MONGO_URI) {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10, // Atlas free tier has a small connection limit, keep this low
    });
    console.log(`[db] connected to ${mongoose.connection.name}`);
    return mongoose.connection;
}

export async function disconnectDb() {
    await mongoose.disconnect();
}
