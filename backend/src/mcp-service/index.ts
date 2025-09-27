import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import serverRoutes from './routes/mcp.route';
dotenv.config();
const app = express();
app.use(express.json());
app.set('trust proxy', true);
const PORT = 4002;
const MONGO_URI = process.env.MONGO_URI!;
const DB_NAME = process.env.DB_NAME!;
MongoClient.connect(MONGO_URI)
    .then(async client => {
        const db = client.db(DB_NAME);
        app.locals.db = db;

        app.use('/', serverRoutes);
        ;
        app.listen(PORT, () => {
            console.log(`🛜 mcp service running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err);
    });
