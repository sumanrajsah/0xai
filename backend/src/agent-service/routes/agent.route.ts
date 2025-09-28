import { Router } from 'express';
import { checkHandle, createAgent } from '../controllers/create';
import { getAgentByAddress, getAgentById, getAllAgents } from '../controllers/get';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { AgentChat } from '../controllers/completion';
import { editAgent } from '../controllers/edit';
import { allowedOrigins } from '../../utils/allowedOrigin';
import { authenticate } from '../../auth-service/middleware/auth.midleware';
const router = Router();
dotenv.config();
router.use((req, res, next) => {
    if (req.path.includes('/completion')) {
        const requestStartTime = Date.now();
        console.log(`🚀 Chat completion request started: ${req.method} ${req.path}`);
        console.log(`📊 Request headers:`, {
            'user-agent': req.headers['user-agent'],
            'connection': req.headers.connection,
            'content-length': req.headers['content-length'],
            'content-type': req.headers['content-type'],
            'accept': req.headers.accept,
            'cache-control': req.headers['cache-control']
        });

        // Create AbortController for this request
        const abortController = new AbortController();
        (req as any).abortController = abortController;
        (req as any).requestStartTime = requestStartTime;

        // Enhanced SSE detection
        const isSSERequest = req.headers.accept?.includes('text/event-stream') ||
            req.body?.stream === true ||
            req.query.stream === 'true';

        if (isSSERequest) {
            console.log('🔄 SSE request detected, configuring for streaming');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Keep-Alive', 'timeout=60000, max=10000');
            res.setHeader('X-Accel-Buffering', 'no');
            res.setHeader('Cache-Control', 'no-cache');
        }

        // Track request state
        let requestEnded = false;

        // Enhanced timeout handler (15 minutes)
        const timeoutId = setTimeout(() => {
            if (!requestEnded) {
                const duration = Date.now() - requestStartTime;
                console.log(`⏰ Request timeout after ${duration}ms - 15 minutes exceeded`);
                requestEnded = true;

                // Abort with timeout reason
                abortController.abort(new Error('Request timeout'));

                if (!res.headersSent) {
                    res.status(408).json({ error: 'Request timeout' });
                } else if (!res.writableEnded) {
                    res.write(`data: ${JSON.stringify({ error: 'Request timeout', type: 'timeout' })}\n\n`);
                    res.end();
                }
            }
        }, 15 * 60 * 1000); // 15 minutes

        // Enhanced client disconnect handler
        const handleDisconnect = () => {
            if (!requestEnded) {
                const duration = Date.now() - requestStartTime;
                console.log(`🔌 Client disconnected after ${duration}ms: ${req.method} ${req.path}`);

                // Enhanced disconnect analysis
                if (duration < 100) {
                    console.log(`⚠️  Immediate disconnect (${duration}ms) - possible causes:`);
                    console.log(`    - Client not configured for SSE`);
                    console.log(`    - CORS issues`);
                    console.log(`    - Client timeout too low`);
                    console.log(`    - Network connectivity issues`);
                } else if (duration < 1000) {
                    console.log(`⚠️  Very quick disconnect (${duration}ms) - likely client-side issue`);
                } else if (duration < 5000) {
                    console.log(`⚠️  Quick disconnect (${duration}ms) - possible timeout or user action`);
                } else {
                    console.log(`ℹ️  Normal disconnect after ${duration}ms`);
                }

                requestEnded = true;
                clearTimeout(timeoutId);

                // Abort with disconnect reason - this will trigger the Chat controller's abort handling
                if (!abortController.signal.aborted) {
                    console.log('📡 Aborting controller due to client disconnect');
                    abortController.abort(new Error('Client disconnected'));
                }
            }
        };

        // Enhanced completion handler
        const handleCompletion = () => {
            if (!requestEnded) {
                const duration = Date.now() - requestStartTime;
                console.log(`✅ Chat completion request finished after ${duration}ms: ${req.method} ${req.path}`);
                requestEnded = true;
                clearTimeout(timeoutId);

                // Clean up event listeners
                req.removeListener('close', handleDisconnect);
                res.removeListener('finish', handleCompletion);
                res.removeListener('close', handleDisconnect);
            }
        };

        // Attach event listeners with better error handling
        // Note: We're only using res.on('close') for disconnect detection
        // as it's more reliable for SSE connections
        res.on('finish', handleCompletion);
        res.on('close', handleDisconnect);

        // Handle errors with better logging
        req.on('error', (err) => {
            const duration = Date.now() - requestStartTime;
            console.error(`❌ Request error after ${duration}ms:`, err.message);
            console.error(`    Error details:`, {
                code: (err as any).code,
                errno: (err as any).errno,
                syscall: (err as any).syscall
            });
            handleDisconnect();
        });

        res.on('error', (err) => {
            const duration = Date.now() - requestStartTime;
            console.error(`❌ Response error after ${duration}ms:`, err.message);
            console.error(`    Error details:`, {
                code: (err as any).code,
                errno: (err as any).errno,
                syscall: (err as any).syscall
            });
            handleCompletion();
        });

        // Add abort signal debugging
        abortController.signal.addEventListener('abort', () => {
            const duration = Date.now() - requestStartTime;
            console.log(`🛑 AbortController signal fired after ${duration}ms`);
            console.log(`🛑 Abort reason:`, abortController.signal.reason);
        });
    }
    next();
});
router.use(cookieParser());

// Create Agent

router.post('/create', createAgent);
router.post('/chat/completion', AgentChat)
router.post('/check-handle', checkHandle)

// Get All Agents
router.get('/', getAllAgents);
router.get('/aid/:aid', getAgentById);
router.get('/address/:address', getAgentByAddress);

export default router;
