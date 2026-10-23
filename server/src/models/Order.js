import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        symbol: { type: String, required: true }, // 'BTCUSDT'
        side: { type: String, enum: ['BUY', 'SELL'], required: true },
        qtyUnits: { type: Number, required: true }, // integer, 1e-8 coin units
        priceCents: { type: Number, required: true }, // integer cents per coin
        totalCents: { type: Number, required: true }, // integer cents
        source: { type: String, enum: ['manual', 'bot'], default: 'manual' },
        decisionId: { type: mongoose.Schema.Types.ObjectId, default: null },
        idempotencyKey: { type: String, required: true },
        status: { type: String, enum: ['FILLED'], default: 'FILLED' },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Same user + same key = same order. This unique index is the safety net
// behind "retrying a request must never trade twice".
orderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
orderSchema.index({ userId: 1, _id: -1 }); // newest first + keyset pagination
export const Order = mongoose.model('Order', orderSchema);