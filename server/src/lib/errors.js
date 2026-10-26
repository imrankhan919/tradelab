export class AppError extends Error {
    constructor(code, message, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
    }
}
export const Errors = {
    insufficientFunds: () => new AppError('INSUFFICIENT_FUNDS', 'Not enough cash in your wallet', 409),
    insufficientHoldings: () => new AppError('INSUFFICIENT_HOLDINGS', 'Not enough coins to sell', 409),
    priceStale: () => new AppError('PRICE_STALE', 'Live price is not available right now, try again shortly', 503),
    unauthorized: () => new AppError('UNAUTHORIZED', 'Please log in', 401),
    badRequest: (msg) => new AppError('BAD_REQUEST', msg, 400),
    notFound: () => new AppError('NOT_FOUND', 'Not found', 404),
};