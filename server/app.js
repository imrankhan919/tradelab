import express from "express"
import mongoose from 'mongoose';
import cors from 'cors';
import { env } from './config/env.js';

export function createApp() {

    const app = express();
    app.set('trust proxy', 1);
    app.use(cors({ origin: env.CLIENT_ORIGIN }));
    app.use(express.json({ limit: '10kb' }));

    app.get('/health', (_req, res) => {
        const up = mongoose.connection.readyState === 1;
        res.status(up ? 200 : 503).json({ ok: up });
    });

    return app;
}