import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import agentRoutes from './routes/agent.route';
import healthRoutes from './routes/health.routes';
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();


app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 4002;
const MONGO_URI = process.env.MONGO_URI!;
const DB_NAME = process.env.DB_NAME!;

(async () => {
    try {
        // ✅ Connect Redis
        // Add to app context

        // ✅ Connect MongoDB
        const client = await MongoClient.connect(MONGO_URI);
        const db = client.db(DB_NAME);
        app.locals.db = db;
        // ✅ Routes
        app.use('/health', healthRoutes);
        app.use('/', agentRoutes);

        // ✅ Start Server
        app.listen(PORT, () => {
            console.log(`🤖 Agent service running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ App initialization failed:', err);
    }
})();
