import { AppError } from '../lib/errors.js';

export const validate =
    (schema, part = 'body') =>
        (req, _res, next) => {
            const result = schema.safeParse(req[part]);
            if (!result.success) {
                const details = result.error.issues.map((i) => ({
                    field: i.path.join('.'),
                    message: i.message,
                }));
                const err = new AppError('VALIDATION_ERROR', 'Invalid input', 400);
                err.details = details;
                throw err;
            }
            req.valid = { ...(req.valid || {}), [part]: result.data };
            next();
        };



export function requireIdempotencyKey(req, _res, next) {
    const key = req.get('idempotency-key');
    if (!key || key.length < 8 || key.length > 100) {
        throw new AppError('IDEMPOTENCY_KEY_REQUIRED', 'Send an Idempotency-Key header (8-100 chars)', 400);
    }
    req.idempotencyKey = key;
    next();
} 