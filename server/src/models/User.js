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


export const User = mongoose.model('User', userSchema);
