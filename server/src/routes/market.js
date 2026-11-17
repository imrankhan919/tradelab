import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { Candle } from '../models/Candle.js';
// import { snapshotForClients } from '../services/marketCache.js';
import { SYMBOLS, ASSETS } from '../config/env.js';


const router = Router();


// router.get('/prices', (_req, res) => res.json({ prices: snapshotForClients() }));

const candleSchema = z.object({
    symbol: z.string().refine((s) => SYMBOLS.includes(s), 'Unknown symbol'),
    interval: z.enum(['1m', '1h']).default('1m'),
    limit: z.coerce.number().int().min(1).max(500).default(120),
});


router.get('/candles', validate(candleSchema, 'query'), async (req, res) => {
    const { symbol, interval, limit } = req.valid.query;
    // Uses the unique compound index: equality, equality, then sort.
    const rows = await Candle.find({ symbol, interval })
        .sort({ openTime: -1 })
        .limit(limit)
        .select('openTime o h l c v -_id')
        .lean();
    res.json({ symbol, interval, candles: rows.reverse() }); // oldest first for charts
});


export default router;