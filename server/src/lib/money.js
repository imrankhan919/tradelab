// MONEY RULES FOR THIS PROJECT
// - USD is stored as integer CENTS ($12.34 -> 1234)
// - Coins are stored as integer UNITS of 1e-8 (0.001 BTC -> 100000)
// - Prices are stored as integer CENTS per 1 coin
// Floats are never stored. 0.1 + 0.2 !== 0.3 in JavaScript, and in a wallet
// that kind of error becomes a bug report.
export const UNITS_PER_COIN = 100_000_000n;
// "12.34" -> 1234. Rejects "12.345", "-5", "1e3", "abc".
export function parseUsd(str) {
    if (typeof str !== 'string' || !/^\d+(\.\d{1,2})?$/.test(str)) {
        throw new Error('Invalid USD amount');
    }
    const [whole, frac = ''] = str.split('.');
    return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}
// "0.001" -> 100000
export function parseCoins(str) {
    if (typeof str !== 'string' || !/^\d+(\.\d{1,8})?$/.test(str)) {
        throw new Error('Invalid coin quantity');
    }

    const [whole, frac = ''] = str.split('.');
    return Number(whole) * 1e8 + Number(frac.padEnd(8, '0'));
}
// Binance sends prices as strings like "64321.12000000" -> 6432112
export function priceToCents(str) {
    return Math.round(Number(str) * 100);
}
// Total cost in cents of qtyUnits coins at priceCents per coin.
// BigInt is used because qtyUnits * priceCents can exceed 2^53.
export function costCents(qtyUnits, priceCents) {
    const product = BigInt(qtyUnits) * BigInt(priceCents);
    return Number((product + UNITS_PER_COIN / 2n) / UNITS_PER_COIN); // round half up
}
// How many units can `budgetCents` buy at priceCents? (rounded down)
export function unitsForBudget(budgetCents, priceCents) {
    return Number((BigInt(budgetCents) * UNITS_PER_COIN) / BigInt(priceCents));
}
export const centsToUsd = (cents) => (cents / 100).toFixed(2);
export const unitsToCoins = (units) => (units / 1e8).toFixed(8);