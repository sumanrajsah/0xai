import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import chatRoutes from './routes/chat.route';
import cors from 'cors';
dotenv.config();
const app = express();
//app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.set('trust proxy', true);
const PORT = 4004;
const MONGO_URI = process.env.MONGO_URI!;
const DB_NAME = process.env.DB_NAME!;
(async () => {
    try {
        // Add to app context

        // ✅ Connect MongoDB
        const client = await MongoClient.connect(MONGO_URI);
        const db = client.db(DB_NAME);
        app.locals.db = db;
        // ✅ Routes
        app.use('/', chatRoutes);

        // ✅ Start Server
        app.listen(PORT, () => {
            console.log(`🤖 Agent service running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ App initialization failed:', err);
    }
})();
