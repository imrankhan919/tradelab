import { AppError } from '../lib/errors.js';


export function notFoundHandler(_req, res) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

export function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        return res.status(err.status).json({
            error: { code: err.code, message: err.message, details: err.details },
        });
    }
    // MongoDB duplicate key (unique index violated)
    if (err && err.code === 11000) {
        return res.status(409).json({ error: { code: 'DUPLICATE', message: 'This already exists' } });
    }
    // Errors from Express itself: malformed JSON (400), body too large (413), and so on.
    // They carry a 4xx status and are safe to show.
    if (err && err.status >= 400 && err.status < 500 && err.expose) {
        const code = err.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST';
        return res.status(err.status).json({ error: { code, message: err.message } });
    }
    console.error('[error]', err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
}