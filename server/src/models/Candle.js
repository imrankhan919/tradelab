import mongoose from 'mongoose';
// One document per candle. interval is '1m' (raw, from Binance) or '1h' (rolled up by us).
// o/h/l/c are integer cents. v is volume in coins (a float is fine, it is not money).
const candleSchema = new mongoose.Schema(
    {
        symbol: { type: String, required: true },
        interval: { type: String, enum: ['1m', '1h'], required: true },
        openTime: { type: Date, required: true },
        o: { type: Number, required: true },
        h: { type: Number, required: true },
        l: { type: Number, required: true },
        c: { type: Number, required: true },
        v: { type: Number, default: 0 },
    },
    { collection: 'candles', versionKey: false }
);
// 1. Uniqueness: one candle per (symbol, interval, openTime).
// This makes every ingestion and backfill IDEMPOTENT: running it twice
// cannot create duplicates.
// 2. The same index serves the common query:
// "latest N candles for BTCUSDT 1m" (equality, equality, then sort)
candleSchema.index({ symbol: 1, interval: 1, openTime: 1 }, { unique: true });
// TTL: MongoDB deletes 1-minute candles older than 30 days automatically.
// The partial filter means the 1-hour candles are kept forever.
// This is how we stay inside the free 512 MB Atlas limit.
candleSchema.index(
    { openTime: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { interval: '1m' } }
);
export const Candle = mongoose.model('Candle', candleSchema);