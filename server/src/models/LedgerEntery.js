import mongoose from "mongoose"



const ledgerSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        kind: { type: String, enum: ['DEPOSIT', 'BUY', 'SELL'], required: true },
        asset: { type: String, required: true },
        amount: { type: Number, required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
        idempotencyKey: { type: String, default: undefined },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);


// "Show me my latest entries", newest first. ObjectIds grow over time, so sorting
// by _id is sorting by time, and it lets us paginate with "_id < lastSeenId"
// (keyset pagination) instead of slow skip().
ledgerSchema.index({ userId: 1, _id: -1 });


// Reconcile / balance rebuild groups by user and asset.
ledgerSchema.index({ userId: 1, asset: 1 });


// A deposit retried with the same key must not credit twice.
ledgerSchema.index(
    { userId: 1, idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);


export const LedgerEntry = mongoose.model('LedgerEntry', ledgerSchema);
