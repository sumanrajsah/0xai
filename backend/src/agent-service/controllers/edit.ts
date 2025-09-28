import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Agent } from '../types/agent';
import { v7 as uuidv7 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';


export const editAgent = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;
    const { aid } = req.params; // Agent ID from URL params
    const { uid, configId, modificationMode, image } = req.body;
    const agentData = JSON.parse(req.body.agentData);

    const user = (req as any).user

    if (uid !== user.uid) {
        res.status(403).json({ error: "Forbidden: Unauthorized access" });
        return;
    }

    if (!aid || !agentData) {
        res.status(400).json({ error: 'Agent ID or agent data missing' });
        return;
    }
    console.log(req.body)
    try {
        // ✅ Check if agent exists and belongs to user
        const existingAgent = await db.collection('agents').findOne({ aid, uid });
        if (!existingAgent) {
            res.status(404).json({ error: 'Agent not found or unauthorized' });
            return;
        }


        if (modificationMode === 'same') {

            // ✅ Prepare update data
            const updateData: Record<string, any> = {
                updatedAt: new Date()
            };
            if (agentData.description !== existingAgent.description) {
                updateData.description = agentData.description;
            }

            const data = await db.collection('assets').findOne({ url: image })
            console.log(data)




            // ✅ Update agent in database
            const result = await db.collection('agents').updateOne(
                { aid, uid },
                { $set: updateData }
            );
            const updateConfig = {
                config: agentData.config,
                updatedAt: new Date()

            }
            const response = await db.collection('agent_config').updateOne(
                { aid, config_id: configId },
                { $set: updateConfig }
            );

            if (result.matchedCount === 0) {
                res.status(404).json({ error: 'Agent not found or unauthorized' });
                return;
            }
        }
        if (modificationMode === 'new') {
            const extraData = {
                config_id: `config_${uuidv7()}`,
                aid: aid,
                status: 'draft',
                version: 3,
                createdAt: new Date(),
                // ✅ Attach public image URL to agent
            };
            const agentdata = { ...agentData.config, ...extraData };
            const result = await db.collection('agent_config').insertOne(agentdata);
        }

        // ✅ Get updated agent
        const updatedAgent = await db.collection('agents').aggregate([
            {
                $match: { aid }
            },
            {
                $lookup: {
                    from: 'agent_config',
                    localField: 'aid',
                    foreignField: 'aid',
                    as: 'configs' // will contain all matching configs as an array
                }
            }
        ]).toArray();
        await redis.set(`agent:${aid}`, JSON.stringify(updatedAgent), {
            EX: 3600 // seconds = 1 hour
        });
        res.status(200).json({
            message: 'Agent updated successfully',
        });

    } catch (err) {
        console.error('Failed to edit agent:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};