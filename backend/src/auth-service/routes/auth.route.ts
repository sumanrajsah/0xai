import { Router } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import { allowedOrigins } from '../../utils/allowedOrigin';
import { Account, authMe, logout } from '../controllers/auth.controller';
const router = Router();
dotenv.config();

router.use(cookieParser());
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
router.post('/account', Account)
router.post('/logout', logout)
router.get('/me', authMe)


export default router;
