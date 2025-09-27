//auth midleware
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v7 as uuidv7 } from 'uuid';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const token =
        req.cookies.token

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
            (req as any).user = decoded;
            console.log('Authenticated user:', decoded);
            next();
            return;
        } catch (err) {
            // Don't return immediately—check if it's a valid API key instead
        }
    }
};