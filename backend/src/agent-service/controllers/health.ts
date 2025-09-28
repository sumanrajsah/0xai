import { Request, Response } from 'express';

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;

    let dbStatus = 'disconnected';
    try {
        // Check MongoDB connection
        await db.command({ ping: 1 });
        dbStatus = 'connected';
    } catch {
        dbStatus = 'error';
    }

    res.status(dbStatus === 'connected' ? 200 : 500).json({
        status: dbStatus === 'connected' ? 'ok' : 'error',
        uptime: process.uptime().toFixed(2) + 's',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        services: {
            mongodb: dbStatus,
        },
    });
};
