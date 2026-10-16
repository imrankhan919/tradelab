import http from 'node:http';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';


await connectDb()


const server = http.createServer(createApp());
server.listen(env.PORT, () => console.log(`[server] listening on :${env.PORT}`));