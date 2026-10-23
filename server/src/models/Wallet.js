import mongoose from "mongoose"


const walletSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        cashCents: { type: Number, default: 0 }, // integer cents
        depositedCents: { type: Number, default: 0 }, // denormalized: total fake money ever loaded
        holdings: { type: mongoose.Schema.Types.Mixed, default: {} }, // { BTC: units, ... } units = 1e-8 coin
    },
    { timestamps: true, minimize: false }
);


walletSchema.index({ userId: 1 }, { unique: true });
export const Wallet = mongoose.model('Wallet', walletSchema);