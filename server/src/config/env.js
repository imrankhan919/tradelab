import 'dotenv/config';
import { z } from 'zod';
// Validate every environment variable once, at startup.
// If something is missing the server refuses to start with a clear message,
// instead of crashing later in a random place.
const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    SYMBOLS: z.string().default('BTCUSDT,ETHUSDT,SOLUSDT'),
    BINANCE_REST: z.string().default('https://data-api.binance.vision'),
    BINANCE_WS: z.string().default('wss://data-stream.binance.vision:443'),
    RUN_COLLECTOR: z.string().default('true'),
    RUN_WORKERS: z.string().default('true'),
    REDIS_URL: z.string().optional().default(''),
    LLM_PROVIDER: z.enum(['mock', 'gemini', 'groq']).default('mock'),
    GEMINI_API_KEY: z.string().optional().default(''),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash-lite'),
    GROQ_API_KEY: z.string().optional().default(''),
    GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
    BOT_INTERVAL_MIN: z.coerce.number().default(15),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:');
    for (const issue of parsed.error.issues) {
        console.error(` ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}
export const env = parsed.data;
export const SYMBOLS = env.SYMBOLS.split(',').map((s) => s.trim().toUpperCase());
export const ASSETS = SYMBOLS.map((s) => s.replace(/USDT$/, '')); // BTCUSDT -> BTC
export const baseAsset = (symbol) => symbol.replace(/USDT$/, '');
export const isTrue = (v) => String(v).toLowerCase() === 'true';
