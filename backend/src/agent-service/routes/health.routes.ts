// routes/health.route.ts
import { Router } from 'express';
import { healthCheck } from '../controllers/health';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authenticate } from '../../auth-service/middleware/auth.midleware';
const router = Router();
router.use(cookieParser());
router.use(cors({
    origin: 'http://localhost:3001', // your frontend URL
    credentials: true,
}));
router.get('/', authenticate, healthCheck);

export default router;
