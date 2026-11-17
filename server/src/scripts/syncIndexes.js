import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../config/db.js';
import '../models/User.js';
import '../models/Wallet.js';
import "../models/LedgerEntery.js"
import '../models/Order.js';
import '../models/Candle.js';

await connectDb();
for (const model of Object.values(mongoose.models)) {
    await model.syncIndexes(); // creates missing indexes, drops ones that are no longer in the schema
    const list = await model.collection.indexes();
    console.log(`\n${model.collection.collectionName}`);
    for (const idx of list) {
        const flags = [idx.unique && 'unique', idx.sparse && 'sparse', idx.expireAfterSeconds !== undefined && `ttl=${idx.expireAfterSeconds}s`, idx.partialFilterExpression && 'partial']
            .filter(Boolean)
            .join(', ');
        console.log(` ${idx.name} ${JSON.stringify(idx.key)}${flags ? ` [${flags}]` : ''}`);
    }
}
await disconnectDb();