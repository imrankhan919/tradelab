import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { AppError } from '../lib/errors.js';
import { LedgerEntry } from '../models/LedgerEntery.js';



export const MAX_DEPOSIT_CENTS = 10_000_00; // $10,000 of fake money per deposit
export const MAX_TOTAL_DEPOSIT_CENTS = 100_000_00; // $100,000 lifetime per user



export async function createUserWithWallet({ email, name, passwordHash }) {
    const session = await mongoose.startSession()
    try {
        let user
        await session.withTransaction(async () => {
            let users = await User.create([{ email, name, passwordHash }], { session })
            user = users[0]
            await Wallet.create([{
                userId: user._id, cashCents: 0,
                depositedCents: 0, holdings: {}
            }], { session })
        })
        return user
    } catch (error) {
        throw error
    } finally {
        await session.endSession()
    }

}


// Load fake money. Safe to retry: the same idempotencyKey credits only once.
export async function deposit({ userId, cents, idempotencyKey }) {

    if (!Number.isInteger(cents) || cents <= 0 || cents > MAX_DEPOSIT_CENTS) {
        throw new AppError('INVALID_AMOUNT', `Deposit must be between $0.01 and $${MAX_DEPOSIT_CENTS / 100}`, 400);
    }

    const session = await mongoose.startSession();

    try {
        let replayed = false;
        await session.withTransaction(async () => {
            replayed = false;
            const already = await LedgerEntry.findOne({ userId, idempotencyKey }).session(session);
            if (already) {
                replayed = true;
                return;
            }
            // Conditional update: only succeeds if the lifetime cap is not exceeded.
            // The check and the increment happen in ONE atomic operation.
            const wallet = await Wallet.findOneAndUpdate(
                { userId, depositedCents: { $lte: MAX_TOTAL_DEPOSIT_CENTS - cents } },
                { $inc: { cashCents: cents, depositedCents: cents } },
                { new: true, session }
            );
            if (!wallet) throw new AppError('DEPOSIT_LIMIT', 'Lifetime fake-money limit reached', 409);
            await LedgerEntry.create([{ userId, kind: 'DEPOSIT', asset: 'USD', amount: cents, idempotencyKey }], { session });
        });
        const wallet = await Wallet.findOne({ userId }).lean();
        return { wallet, replayed };
    } catch (err) {
        // Two identical requests at the same instant: the unique index stops the second.
        if (err.code === 11000) {
            const wallet = await Wallet.findOne({ userId }).lean();
            return { wallet, replayed: true };
        }
        throw err;
    } finally {
        await session.endSession();
    }


}