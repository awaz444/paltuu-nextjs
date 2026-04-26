/**
 * Paltuu Social — Real-Time WebSocket Server
 * 
 * Run alongside Next.js:
 *   node server/social-realtime.js
 * 
 * Or add to package.json scripts:
 *   "realtime": "node server/social-realtime.js"
 * 
 * Connects on port 3001 (configurable via REALTIME_PORT env var).
 * 
 * CLIENT USAGE (React Native):
 *   import { io } from 'socket.io-client';
 *   const socket = io('http://your-server:3001', { auth: { userId: '123' } });
 * 
 * EVENTS THE CLIENT RECEIVES:
 *   post:liked       → { postId, userId, like_count }
 *   post:commented   → { postId, comment }
 *   post:reposted    → { postId, userId, repost_count }
 *   follow:new       → { followerId, followerName }
 *   notification:new → { ...notification object }
 * 
 * EVENTS THE CLIENT EMITS:
 *   post:join  → postId    (subscribe to real-time updates for a specific post)
 *   post:leave → postId    (unsubscribe)
 */

require('dotenv').config();
const { Server } = require('socket.io');
const http = require('http');
const { Pool } = require('pg');

const PORT = parseInt(process.env.REALTIME_PORT || '3001');
const NEXT_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── DB Pool ──────────────────────────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.NEW_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5, // Small pool — only used for notification lookups
});

// ─── HTTP + Socket.io Server ──────────────────────────────────────────────────
const httpServer = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', port: PORT }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

const io = new Server(httpServer, {
    cors: {
        origin: [NEXT_ORIGIN, 'http://localhost:3000', 'http://localhost:19006'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 10000,
});

// ─── Auth Middleware ───────────────────────────────────────────────────────────
// Validates userId from handshake auth — no JWT needed on same server
io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) {
        return next(new Error('Authentication required: provide userId in socket.auth'));
    }
    socket.data.userId = parseInt(userId, 10);
    next();
});

// ─── Connected users map: userId → Set of socket IDs ─────────────────────────
const userSockets = new Map(); // userId → Set<socketId>

function getUserSockets(userId) {
    return userSockets.get(userId) || new Set();
}

function emitToUser(userId, event, data) {
    const sockets = getUserSockets(userId);
    sockets.forEach(socketId => {
        io.to(socketId).emit(event, data);
    });
}

// ─── Connection Handler ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[ws] User ${userId} connected (socket: ${socket.id})`);

    // Track socket for this user
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join personal notification room
    socket.join(`user:${userId}`);

    // ── Subscribe to a specific post's live updates ──────────────────────────
    socket.on('post:join', (postId) => {
        socket.join(`post:${postId}`);
    });

    socket.on('post:leave', (postId) => {
        socket.leave(`post:${postId}`);
    });

    // ── Disconnect cleanup ────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        const sockets = userSockets.get(userId);
        if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                userSockets.delete(userId);
            }
        }
        console.log(`[ws] User ${userId} disconnected`);
    });
});

// ─── Public Emitter API ───────────────────────────────────────────────────────
// Called by your Next.js API routes via HTTP POST to emit real-time events.
// This avoids cross-process socket.io sharing complexity.

const emitterServer = http.createServer(async (req, res) => {
    if (req.method !== 'POST') {
        res.writeHead(405);
        res.end();
        return;
    }

    // Simple internal auth — only accept from same host
    const internalKey = req.headers['x-internal-key'];
    if (internalKey !== process.env.REALTIME_INTERNAL_KEY) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { event, room, data } = JSON.parse(body);
            if (!event || !room) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'event and room required' }));
                return;
            }
            io.to(room).emit(event, data);
            res.writeHead(200);
            res.end(JSON.stringify({ emitted: true }));
        } catch (err) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
    });
});

const EMITTER_PORT = parseInt(process.env.REALTIME_EMITTER_PORT || '3002');

// ─── Start Servers ────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`\n🚀 Paltuu Social Real-Time Server`);
    console.log(`   WebSocket:  ws://localhost:${PORT}`);
    console.log(`   Health:     http://localhost:${PORT}/health`);
    console.log(`   CORS:       ${NEXT_ORIGIN}\n`);
});

emitterServer.listen(EMITTER_PORT, () => {
    console.log(`   Emitter API: http://localhost:${EMITTER_PORT} (internal only)\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[ws] Shutting down...');
    io.close();
    httpServer.close();
    emitterServer.close();
    await pool.end();
    process.exit(0);
});
