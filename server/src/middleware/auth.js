import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Errors } from '../lib/errors.js';


export function signToken(userId) {
    return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, { expiresIn: '7d' });
}


export function authRequired(req, res, next) {

    const header = req.get('authorizatrion') || ''
    const [scheme, token] = header.split(" ")
    if (scheme !== "Bearer" || !token) throw Errors.unauthorized()

    try {
        const payload = jwt.verify(token, env.JWT_SECRET)
        req.userId = payload.sub
        next()
    } catch {
        throw Errors.unauthorized()
    }

}