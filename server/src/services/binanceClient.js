import { env } from '../config/env.js';
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// fetch() + timeout + retry with exponential backoff.
// Real APIs fail: timeouts, 429 (slow down), 5xx (their bug). A production
// client retries those, waits longer each time, and gives up eventually.
export async function fetchJson(url, { retries = 4, timeoutMs = 10_000 } = {}) {
    let attempt = 0;
    while (true) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
            if (res.status === 429 || res.status >= 500) {
                const retryAfter = Number(res.headers.get('retry-after')) || 0;
                throw Object.assign(new Error(`HTTP ${res.status}`), { retryable: true, retryAfter });
            }
            // 418 means "you were banned for ignoring 429s". Retrying makes it worse. 4xx: our bug.
            if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
            return await res.json();
        } catch (err) {
            // fetch() throws TypeError on network failure, TimeoutError when AbortSignal fires
            const retryable = err.retryable || err.name === 'TimeoutError' || err.name === 'TypeError';
            if (!retryable || attempt >= retries) throw err;
            const backoff = Math.min(30_000, 500 * 2 ** attempt) + Math.random() * 250; // jitter
            const wait = err.retryAfter ? err.retryAfter * 1000 : backoff;
            attempt += 1;
            console.warn(`[http] ${err.message}, retry ${attempt}/${retries} in ${Math.round(wait)}ms`);
            await sleep(wait);
        }
    }
}
export function fetchKlines({ symbol, interval = '1m', startTime, endTime, limit = 1000 }) {
    const params = new URLSearchParams({ symbol, interval, limit: String(limit) });
    if (startTime) params.set('startTime', String(startTime));
    if (endTime) params.set('endTime', String(endTime));
    return fetchJson(`${env.BINANCE_REST}/api/v3/klines?${params}`);
}
