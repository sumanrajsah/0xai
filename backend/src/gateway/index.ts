import express, { ErrorRequestHandler } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import cors from 'cors';
import { IncomingMessage, ServerResponse, ClientRequest } from 'http';
import http from 'http';
import dotenv from 'dotenv';
import { allowedOrigins } from '../utils/allowedOrigin';
dotenv.config();

const app = express();
const PORT = 3002;
const baseVersion = 'v1';

// Enhanced HTTP agent for better connection handling
const agent = new http.Agent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 15 * 60 * 1000, // 15 minutes
    keepAliveMsecs: 30000
});

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('This origin is not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));

// FIXED: Enhanced proxy options specifically for SSE
const createSSEProxyOptions = (target: string, pathRewrite: Record<string, string>) => ({
    target,
    pathRewrite,
    changeOrigin: true,
    cookieDomainRewrite: 'localhost',
    agent: agent,

    // CRITICAL: Extended timeouts for long-running SSE connections
    proxyTimeout: 15 * 60 * 1000, // 15 minutes
    timeout: 15 * 60 * 1000,

    // FIXED: Better request handling for SSE
    onProxyReq: (proxyReq: http.ClientRequest, req: express.Request, res: express.Response) => {
        const isSSE = req.headers.accept?.includes('text/event-stream');

        if (isSSE) {
            console.log('GATEWAY: Configuring SSE request headers');
            // Ensure proper headers for SSE
            proxyReq.setHeader('Connection', 'keep-alive');
            proxyReq.setHeader('Cache-Control', 'no-cache');
            proxyReq.setHeader('Accept', 'text/event-stream');
        }

        console.log(`GATEWAY: Proxying ${isSSE ? 'SSE' : 'regular'} request to: ${proxyReq.path}`);
    },

    // CRITICAL: Enhanced response handling for SSE streams
    onProxyRes: (proxyRes: http.IncomingMessage, req: express.Request, res: express.Response) => {
        const isSSE = proxyRes.headers['content-type']?.includes('text/event-stream');

        if (isSSE) {
            console.log('GATEWAY: SSE stream detected, setting up connection handling');

            // FIXED: Don't modify SSE headers - let them pass through
            // Remove any buffering that might interfere
            res.setHeader('X-Accel-Buffering', 'no');

            // Track connection state
            let connectionClosed = false;

            // FIXED: Handle client disconnect properly
            const handleClientDisconnect = () => {
                if (!connectionClosed) {
                    connectionClosed = true;
                    console.log('GATEWAY: Client disconnected from SSE stream');

                    // Destroy the backend connection
                    if (proxyRes && !proxyRes.destroyed) {
                        proxyRes.destroy();
                    }
                }
            };

            // FIXED: Handle backend disconnect
            const handleBackendDisconnect = () => {
                if (!connectionClosed) {
                    connectionClosed = true;
                    console.log('GATEWAY: Backend disconnected from SSE stream');

                    // End the client response if not already ended
                    if (!res.writableEnded) {
                        res.end();
                    }
                }
            };

            // Listen for client disconnect
            req.on('close', handleClientDisconnect);
            req.on('aborted', handleClientDisconnect);
            res.on('close', handleClientDisconnect);

            // Listen for backend disconnect
            proxyRes.on('close', handleBackendDisconnect);
            proxyRes.on('error', (err) => {
                console.error('GATEWAY: Backend SSE error:', err.message);
                handleBackendDisconnect();
            });

            // Cleanup when done
            proxyRes.on('end', () => {
                console.log('GATEWAY: SSE stream ended normally');
                connectionClosed = true;
            });

        } else {
            console.log('GATEWAY: Regular HTTP response');
        }
    },

    // FIXED: Better error handling
    onError: (err: Error, req: express.Request, res: express.Response) => {
        console.error('GATEWAY: Proxy error:', err.message);
        console.error('GATEWAY: Error details:', {
            code: (err as any).code,
            errno: (err as any).errno,
            syscall: (err as any).syscall
        });

        if (!res.headersSent) {
            res.status(502).json({
                error: 'Gateway error',
                details: err.message
            });
        }
    }
});

// Standard proxy options for non-SSE services
const standardProxyOptions = (target: string, pathRewrite: Record<string, string>) => ({
    target,
    pathRewrite,
    changeOrigin: true,
    cookieDomainRewrite: 'localhost',
    agent: agent,

    onProxyReq: (proxyReq: http.ClientRequest, req: express.Request, res: express.Response) => {
        console.log(`GATEWAY: Proxying request to: ${proxyReq.path}`);
    },

    onError: (err: Error, req: express.Request, res: express.Response) => {
        console.error('GATEWAY: Proxy error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Proxy error' });
        }
    }
});

// Auth service proxy
app.use(
    `/${baseVersion}/auth`,
    createProxyMiddleware(standardProxyOptions('http://localhost:4001', {
        [`^/${baseVersion}/auth`]: `/${baseVersion}/auth`,
    }))
);

// Agents service proxy
app.use(
    `/${baseVersion}/agents`,
    createProxyMiddleware(standardProxyOptions('http://localhost:4002', {
        [`^/${baseVersion}/agents`]: `/${baseVersion}/agents`,
    }))
);

// CRITICAL: Chat service proxy with SSE support
app.use(
    `/${baseVersion}/chat`,
    createProxyMiddleware(createSSEProxyOptions('http://localhost:4003', {
        [`^/${baseVersion}/chat`]: `/${baseVersion}/chat`,
    }))
);

// Servers service proxy with SSE support (in case it needs streaming)
app.use(
    `/${baseVersion}/servers`,
    createProxyMiddleware(createSSEProxyOptions('http://localhost:4004', {
        [`^/${baseVersion}/servers`]: `/${baseVersion}/servers`,
    }))
);

// User service proxy
app.use(
    `/${baseVersion}/user`,
    createProxyMiddleware(standardProxyOptions('http://localhost:4005', {
        [`^/${baseVersion}/user`]: `/${baseVersion}/user`,
    }))
);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Enhanced error handler
const errorHandler: express.ErrorRequestHandler = (err: Error, req, res, next) => {
    console.error('GATEWAY: Unhandled error:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
};

app.use(errorHandler);

app.listen(PORT, async () => {
    console.log(`🌐 API Gateway running on http://localhost:${PORT}`);
});