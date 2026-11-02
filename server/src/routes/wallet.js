import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/auth.js';
import { validate, requireIdempotencyKey } from '../middleware/validate.js';
import { deposit } from '../services/walletService.js';
import { parseUsd } from '../lib/money.js';
import { Errors } from '../lib/errors.js';
import { tradeLimiter } from '../middleware/rateLimiter.js';
import { LedgerEntry } from '../models/LedgerEntery.js';

const router = Router();
router.use(authRequired);

const depositSchema = z.object({ amountUsd: z.string() });

router.post('/deposit', tradeLimiter, requireIdempotencyKey, validate(depositSchema), async (req, res) => {
    let cents;
    try {
        cents = parseUsd(req.valid.body.amountUsd);
    } catch {
        throw Errors.badRequest('amountUsd must look like "250.00" (max 2 decimals)');
    }
    const { wallet, replayed } = await deposit({
        userId: req.userId, cents, idempotencyKey: req.idempotencyKey
    });
    res.status(replayed ? 200 : 201).json({ wallet, replayed });
});


// Keyset pagination: "give me 20 entries older than the last one I saw".
// Unlike skip(), the cost does not grow as the user's history grows.
const pageSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    before: z.string().optional(),
});


router.get('/ledger', validate(pageSchema, 'query'), async (req, res) => {
    const { limit, before } = req.valid.query;
    const filter = { userId: req.userId, ...(before ? { _id: { $lt: before } } : {}) };
    const rows = await LedgerEntry.find(filter).sort({ _id: -1 }).limit(limit).lean();
    res.json({ entries: rows, nextBefore: rows.length === limit ? rows[rows.length - 1]._id : null });
});
export default router;

