
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { v7 as uuidv7 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Agent } from '../types/agent';
export const createAgent = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    // console.log('Request body:', req.body);

    // Check if req.body exists
    if (!req.body) {
        res.status(400).json({ success: false, message: 'Request body is missing' });
        return;
    }

    const { uid } = req.body;

    // Check if required fields exist
    if (!uid) {
        res.status(400).json({ success: false, message: 'uid is required' });
        return;
    }

    if (!req.body.agentData) {
        res.status(400).json({ success: false, message: 'agentData is required' });
        return;
    }

    if (!req.body.agentMetadata) {
        res.status(400).json({ success: false, message: 'agentMetadata is required' });
        return;
    }

    const agentData = req.body.agentData;
    const agentMetadata = req.body.agentMetadata
    const user = (req as any).user

    if (uid !== user.uid) {
        res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        return;
    }

    if (!agentData) {
        res.status(400).json({ success: false, message: 'Agent data missing' });
        return;
    }

    const agenth = await db.collection('agents').findOne({ handle: agentMetadata.handle })

    if (agenth) {
        res.status(400).json({ success: false, message: "Agent handle already exists" });
        return;
    }

    try {

        const aid = `agent_${uuidv7()}`

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
            status: 'draft',
            agentData
        }
        const response = await db.collection('agents').insertOne(agent)
        res.status(201).json({ success: true, message: 'Agentcreated successfully', aid: aid });

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
