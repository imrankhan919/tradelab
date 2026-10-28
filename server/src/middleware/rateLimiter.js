import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message) => rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message } }
})

// Login/register: slow down password guessing.
export const authLimiter = make(60_000, 10, 'Too many attempts, wait a minute');
// Money actions: stop accidental loops and abuse.
export const tradeLimiter = make(60_000, 30, 'Too many trades, slow down');
// Everything else.
export const generalLimiter = make(60_000, 120, 'Too many requests');