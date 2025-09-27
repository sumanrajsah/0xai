import { Router } from 'express';
import { checkHandle, createAgent } from '../controllers/create';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { allowedOrigins } from '../../utils/allowedOrigin';
import { authenticate } from '../../auth-service/middleware/auth.midleware';
import { getAgentByUID, GetPublishedAgents } from '../controllers/get';
import { Publish } from '../controllers/publish';
const router = Router();
dotenv.config();
router.use(cors({
    origin: function (origin, callback) {
        //console.log('CORS Origin:', origin, allowedOrigins);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

router.use(cookieParser());

// Create Agent

router.post('/create', authenticate, createAgent);
router.get('/getAgentByUid/:uid', authenticate, getAgentByUID)
router.post('/publish', authenticate, Publish);
router.get('/published', GetPublishedAgents);

export default router;
