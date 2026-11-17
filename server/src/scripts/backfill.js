import { SYMBOLS } from '../config/env.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { backfill } from '../services/candleService.js';
// import { rollupAll } from '../services/rollupService.js';


const days = Number(process.argv[2] || 7);
const only = process.argv[3]?.toUpperCase();
const symbols = only ? [only] : SYMBOLS;

if (!Number.isFinite(days) || days <= 0) {
    console.error('Usage: npm run backfill -- <days> [SYMBOL]');
    process.exit(1);
}
await connectDb();
const from = Date.now() - days * 24 * 3600 * 1000;
for (const symbol of symbols) {
    console.log(`Backfilling ${days} days of ${symbol}...`);
    let lastLog = 0;
    const total = await backfill({
        symbol,
        from,
        onProgress: ({ total, cursor }) => {
            if (Date.now() - lastLog > 2000) {
                console.log(` ${symbol}: ${total} candles, now at ${cursor.toISOString()}`);
                lastLog = Date.now();
            }
        },
    });
    console.log(`${symbol}: done, ${total} candles written`);
}
console.log('Rolling up hourly candles for the last 48h...');
// await rollupAll(Math.min(days * 24, 24 * 30));
await disconnectDb();
