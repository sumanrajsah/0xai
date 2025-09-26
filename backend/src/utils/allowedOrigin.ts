import dotenv from 'dotenv';
dotenv.config();
export const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

export const corsHeadersMiddleware = (req: any, res: any, next: any) => {
    if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
};