import { Router } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import cors from 'cors';
import { corsHeadersMiddleware } from '../../utils/allowedOrigin';
import { authenticate } from '../../auth-service/middleware/auth.midleware';
import { Chat } from '../controllers/completion';

const router = Router();
dotenv.config();
router.use(corsHeadersMiddleware);

router.use(cookieParser());

router.post('/completion', Chat);

export default router;