import { Candle } from '../models/Candle.js';
import { fetchKlines, sleep } from './binanceClient.js';
import { klineRowToCandle } from '../lib/klines.js';
const MINUTE = 60_000;
// Insert-or-update many candles in ONE round trip.
// Because (symbol, interval, openTime) is a unique index, running this twice
// with the same data changes nothing. That property is called idempotency.
export async function upsertCandles(docs) {
    if (docs.length === 0) return 0;
    const ops = docs.map((d) => ({
        updateOne: {
            filter: { symbol: d.symbol, interval: d.interval, openTime: d.openTime },
            update: { $set: { o: d.o, h: d.h, l: d.l, c: d.c, v: d.v } },
            upsert: true,
        },
    }));
    const res = await Candle.bulkWrite(ops, { ordered: false });
    return res.upsertedCount + res.modifiedCount;
}
// Download 1-minute candles from `from` (ms) to `to` (ms), 1000 per request.
export async function backfill({ symbol, from, to = Date.now(), delayMs = 250, onProgress }) {
    let cursor = from;
    let total = 0;
    while (cursor < to) {
        const rows = await fetchKlines({ symbol, interval: '1m', startTime: cursor, endTime: to, limit: 1000 });
        if (rows.length === 0) break;
        // Row[6] is the close time. Skip the candle that is still forming.
        const closed = rows.filter((r) => r[6] < Date.now());
        total += await upsertCandles(closed.map((r) => klineRowToCandle(symbol, '1m', r)));
        cursor = rows[rows.length - 1][0] + MINUTE;
        onProgress?.({ symbol, total, cursor: new Date(cursor) });
        if (rows.length < 1000) break;
        await sleep(delayMs); // be polite to the API
    }
    return total;
}
// Called whenever the collector (re)connects. If the server slept or the socket
// dropped, there is a hole in our data. Find the newest candle we have and
// download everything after it.
export async function fillGap(symbol, maxLookbackMs = 24 * 60 * MINUTE) {
    const last = await Candle.findOne({ symbol, interval: '1m' })
        .sort({ openTime: -1 })
        .select('openTime')
        .lean();
    const from = last ? last.openTime.getTime() + MINUTE : Date.now() - 60 * MINUTE;
    if (Date.now() - from < 2 * MINUTE) return 0; // no real gap
    return backfill({ symbol, from: Math.max(from, Date.now() - maxLookbackMs) });
}
export async function getLatestClose(symbol) {
    const row = await Candle.findOne({ symbol, interval: '1m' }).sort({ openTime: -1 }).select('c').lean();
    return row ? row.c : null;
}