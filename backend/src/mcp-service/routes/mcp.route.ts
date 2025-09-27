import { Router } from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { authenticate } from '../../auth-service/middleware/auth.midleware';
import { saveServer } from '../controllers/save';
import { allowedOrigins } from '../../utils/allowedOrigin';


const router = Router();
dotenv.config();
router.use(cookieParser());
router.use(cors({
    origin: function (origin, callback) {
        // console.log('CORS Origin:', origin, allowedOrigins);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

router.post('/save', authenticate, saveServer);

export default router;
