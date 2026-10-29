import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true },
        name: { type: String, required: true, trim: true, maxlength: 40 },
        passwordHash: { type: String, required: true },
        botEnabled: { type: Boolean, default: false },
        riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    },
    { timestamps: true }
);


// The unique index is what REALLY prevents two accounts with one email.
// Checking "does this email exist?" in code is not enough: two requests can
// pass the check at the same moment (a race condition). The index cannot be raced.
userSchema.index({ email: 1 }, { unique: true });
// Used by the bot fan-out: "give me all users whose bot is on".
// A partial index stores ONLY those users, so it stays tiny.
userSchema.index({ botEnabled: 1 }, { partialFilterExpression: { botEnabled: true } });


export const User = mongoose.model('User', userSchema);
