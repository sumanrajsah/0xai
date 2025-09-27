import express, { ErrorRequestHandler } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { IncomingMessage, ServerResponse, ClientRequest } from 'http';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { allowedOrigins } from '../utils/allowedOrigin';

dotenv.config();

const app = express();
const PORT = 3002;
const baseVersion = 'v1';
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
app.use(
    `/${baseVersion}/mcp`,
    createProxyMiddleware(standardProxyOptions('http://localhost:4002', {
        [`^/${baseVersion}/mcp`]: `/${baseVersion}/mcp`,
    }))
);
app.use(
    `/${baseVersion}/agent`,
    createProxyMiddleware(standardProxyOptions('http://localhost:4003', {
        [`^/${baseVersion}/agent`]: `/${baseVersion}/agent`,
    }))
);
app.use(
    `/${baseVersion}/chat`,
    createProxyMiddleware(standardProxyOptions('http://localhost:4004', {
        [`^/${baseVersion}/chat`]: `/${baseVersion}/chat`,
    }))
);


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});
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