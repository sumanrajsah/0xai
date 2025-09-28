import dotenv from 'dotenv';
dotenv.config();

export const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3003'
];

export const corsHeadersMiddleware = (req: any, res: any, next: any) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204); // 204 is cleaner for preflight
    }

    next();
};
