import { priceToCents } from './money.js';
// Binance REST /api/v3/klines returns an array of arrays. Every price is a STRING:
// [ openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, ... ]
export function klineRowToCandle(symbol, interval, row) {
    return {
        symbol,
        interval,
        openTime: new Date(row[0]),
        o: priceToCents(row[1]),
        h: priceToCents(row[2]),
        l: priceToCents(row[3]),
        c: priceToCents(row[4]), v: Number(row[5]),
    };
}


// Binance WebSocket kline event payload (the "k" object):
// { t: openTime, s: symbol, i: interval, o, c, h, l, v, x: isClosed, ... }
export function wsKlineToCandle(k) {
    return {
        symbol: k.s,
        interval: k.i,
        openTime: new Date(k.t),
        o: priceToCents(k.o),
        h: priceToCents(k.h),
        l: priceToCents(k.l),
        c: priceToCents(k.c),
        v: Number(k.v),
    };
}
