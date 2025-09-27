import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { v7 as uuidv7 } from 'uuid';

dotenv.config();


function setAuthCookie(res: Response, token: string) {
    const cookieOpts = {
        httpOnly: true,
        sameSite: 'strict' as const,
        maxAge: 60 * 60 * 1000 * 24 * 30, // 30 days
        // secure: process.env.NODE_ENV === 'production',
    };
    res.cookie('token', token, cookieOpts);

}
export const Account = async (req: Request, res: Response) => {
    const db = req.app.locals.db;
    const data = req.body;

    if (!data.address || !data.signature) {
        return res.status(400).json({ message: 'Address and signature are required' });
    }
    const usersCollection = db.collection('users');

    await usersCollection.findOne({ address: data.address.toLowerCase() }).then(async (user: any) => {
        if (user) {
            const token = jwt.sign(
                { uid: user.uid, address: user.address },
                process.env.JWT_SECRET!,
                { expiresIn: '7d' }
            );
            setAuthCookie(res, token)
            return res.status(201).json({ message: 'User already exists', token, user: { uid: user.uid, address: user.address } });
        } else {
            const newUser = {
                address: data.address.toLowerCase(),
                uid: `${uuidv7()}`,
                signature: data.signature,
                createdAt: new Date()
            };
            await usersCollection.insertOne(newUser).then((result: any) => {
                const insertedUser = result;
                const token = jwt.sign(
                    {
                        uid: insertedUser.uid,
                        address: insertedUser.address,
                        signature: insertedUser.signature,
                        ip: req.ip,
                    },
                    process.env.JWT_SECRET!,
                    {
                        expiresIn: "30d",
                        issuer: "0xai",     // who issued the token
                        audience: "users",    // intended audience
                        jwtid: newUser.uid + "-" + Date.now(), // unique token ID
                    }
                );


                setAuthCookie(res, token)
                return res.status(201).json({ message: 'User created successfully', token, user: { uid: newUser.uid, address: newUser.address } });
            });
        }
    });
};
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
export const authMe = async (req: Request, res: Response) => {
    const db = req.app.locals.db;
    const user = (req as any).user;

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const usersCollection = db.collection('users');
    await usersCollection.findOne({ uid: user.uid }).then((user: any) => {
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        delete user.signature; // Remove sensitive info
        return res.status(200).json({ user });
    }).catch((err: any) => {
        console.error('Error fetching user:', err);
        return res.status(500).json({ message: 'Internal server error' });
    });
};