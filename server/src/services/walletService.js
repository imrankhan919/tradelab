import mongoose from "mongoose"
import User from "../models/User"
import Wallet from "../models/Wallet"

export async function createUserWithWallet({ email, name, passwordHash }) {

    const session = await mongoose.startSession()
    try {
        let user
        await session.withTransaction(async () => {
            [user] = await User.create([{ email, name, passwordHash }], { session })
            await Wallet.create([{ userId: user._id, holding: {} }], { session })
        })
        return user
    } finally {
        await session.endSession()
    }

}