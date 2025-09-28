import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Agent } from '../types/agent';
import { v7 as uuidv7 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import fsPromises from 'fs/promises';
dotenv.config();

async function getUserPlan(db: any, redis: any, uid: string) {
    // Try cache first
    const cacheKey = `user:plan:${uid}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    // Fallback to DB
    const user = await db.collection("users").findOne(
        { uid },
        { projection: { plan: 1 } }
    );
    const plan = user?.plan || "free";

    // Store in cache for 15 minutes (900 seconds)
    await redis.set(cacheKey, plan, "EX", 900);

    return plan;
}
export const createAgent = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;
    const { uid } = req.body;
    const agentData = JSON.parse(req.body.agentData);
    const agentMetadata = JSON.parse(req.body.agentMetadata)

    const user = (req as any).user

    if (uid !== user.uid) {
        res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        return;
    }

    if (!agentData) {
        res.status(400).json({ success: false, message: 'Agent data or image file missing' });
        return;
    }
    const agents = await db.collection('agents').find({ uid }).toArray();
    if (await getUserPlan(db, redis, uid) === "free" && agents.length >= 1) {
        // Apply pro-plus specific logic
        res.status(403).json({ success: false, message: "Free plan users can create only 1 agent. Please upgrade your plan." });
        return;
    }
    const agenth = await db.collection('agents').findOne({ handle: agentMetadata.handle })

    if (agenth) {
        res.status(400).json({ success: false, message: "Agent handle already exists" });
        return;
    }

    try {

        const aid = `agent_${uuidv7()}`

        const extraData = {
            config_id: `config_${uuidv7()}`,
            aid: aid,
            status: 'draft',
            version: 1,
            createdAt: new Date(),
            // ✅ Attach public image URL to agent
        };

        const agentdata: Agent = { ...agentData, ...extraData };
        const agent = {
            name: agentMetadata.name,
            description: agentMetadata.description,
            handle: agentMetadata.handle,
            tags: agentMetadata.tags,
            categories: agentMetadata.categories,
            aid: aid,
            uid,
            createdAt: new Date(),
            updatedAt: new Date(),
            current_version: 1,
            status: 'draft'
        }
        const result = await db.collection('agent_config').insertOne(agentdata);
        const response = await db.collection('agents').insertOne(agent)
        res.status(201).json({ success: true, message: 'Agent and config created successfully' });

    } catch (err) {
        console.error('Failed to create agent:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const checkHandle = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const agents = db.collection("agents");

    const { handle } = req.body; // or req.body depending on how you call it

    if (!handle || typeof handle !== "string") {
        res.status(400).json({ available: false, error: "handle is required" });
        return;
    }

    try {
        const agent = await agents.findOne({ handle: handle.toLowerCase() });

        if (agent) {
            res.json({ available: false, message: "handle is already taken" });
        } else {
            res.json({ available: true, message: "handle is available" });
        }
    } catch (err) {
        console.error("Check handle error:", err);
        res.status(500).json({ available: false, error: "Internal Server Error" });
    }
};
