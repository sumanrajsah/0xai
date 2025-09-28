import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Agent } from '../types/agent';
export const getAllAgents = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const agents = await db.collection('agents').find().toArray();
    // console.log(agents)
    if (agents.length > 0) res.json({ data: agents, message: 'success' });
    else res.json({ data: [], message: 'no agents found' });
};
export const getAgentById = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;
    const aid = req.params.aid;

    try {
        // 1. Try to get agent from Redis
        // const cached = await redis.get(`agent:${aid}`);
        // //console.log(cached)
        // if (cached) {
        //     res.status(200).json(JSON.parse(cached));
        //     return;
        // }

        // 2. Fetch from MongoDB if not in Redis
        const agent = await db.collection('agents').aggregate([
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
        if (!agent) {
            res.status(404).json({ error: 'Agent not found' });
            return;
        }

        // 3. Cache the result in Redis for 1 hour
        await redis.set(`agent:${aid}`, JSON.stringify(agent[0]), {
            EX: 3600 // seconds = 1 hour
        });

        // 4. Return the result
        res.status(200).json(agent[0]);

    } catch (error) {
        console.error('❌ getAgentById error:', error);
        res.status(400).json({ error: 'Invalid ID or internal error' });
    }
};
export const getAgentByAddress = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const Address = req.params.Address;
    const user = (req as any).user
    if (!Address || Address === undefined || Address === 'undefined') {
        res.status(400).json({ success: false, error: 'Address parameter is missing' });
        return;
    }

    if (Address !== user.Address) {
        res.status(403).json({ error: "Forbidden: Unauthorized access" });
        return;
    }


    try {
        const agents = await db.collection('agents').aggregate([
            {
                $match: { Address }
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

        if (!agents || agents.length === 0) {
            res.status(404).json({ success: false, error: 'No agents found for the provided Address' });
            return;
        }

        res.status(200).json({ success: true, agents });
    } catch (err) {
        console.error('Error fetching agents with configs:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
