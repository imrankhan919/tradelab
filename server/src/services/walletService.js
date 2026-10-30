import mongoose from "mongoose"
import { User } from "../models/User.js"
import { Wallet } from "../models/Wallet.js"


export async function createUserWithWallet({ email, name, passwordHash }) {
    console.log("1. Function started")
    const session = await mongoose.startSession()
    console.log("2. Session started")

    try {
        let user
        console.log("3. Starting transaction")
        await session.withTransaction(async () => {
            console.log("4. Transaction callback started")
            let users = await User.create([{ email, name, passwordHash }], { session })
            user = users[0]
            console.log("5. User created:", user._id)
            await Wallet.create([{
                userId: user._id, cashCents: 0,
                depositedCents: 0, holdings: {}
            }], { session })
            console.log("6. Wallet created")
        })
        console.log("7. Transaction completed")
        return user
    } catch (error) {
        console.error("Transaction error:", error)
        throw error

    } finally {
        console.log("8. Ending session")
        await session.endSession()
    }

}