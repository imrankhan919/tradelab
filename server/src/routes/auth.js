import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { createUserWithWallet } from '../services/walletService.js';
import { signToken, authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../lib/errors.js';

const router = Router()

const registerSchema = z.object({
    email: z.email().max(120),
    name: z.string().trim().min(2).max(40),
    password: z.string().min(8).max(72), // bcrypt only uses the first 72 bytes
});

const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(72) });


const publicUser = (u) => ({ id: u._id, email: u.email, name: u.name, botEnabled: u.botEnabled, riskLevel: u.riskLevel })



router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
    const { email, name, password } = req.valid.body;
    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    try {
        user = await createUserWithWallet({ email, name, passwordHash });
    } catch (err) {
        if (err.code === 11000) throw new AppError('EMAIL_TAKEN', 'This email is already registered', 409);
        throw err;
    }
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});


router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.valid.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    // Same message for "no such email" and "wrong password": do not reveal which emails exist.
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw new AppError('BAD_CREDENTIALS', 'Invalid email or password', 401);
    res.json({ token: signToken(user._id), user: publicUser(user) });
});




export default router