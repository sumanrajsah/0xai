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
export const getAgentByUID = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const uid = req.params.uid;
    const user = (req as any).user
    if (!uid || uid === undefined || uid === 'undefined') {
        res.status(400).json({ success: false, error: 'UID parameter is missing' });
        return;
    }

    if (uid !== user.uid) {
        res.status(403).json({ error: "Forbidden: Unauthorized access" });
        return;
    }


    try {
        const agents = await db.collection('agents').find({ uid, status: 'draft' }).toArray();

        if (!agents || agents.length === 0) {
            res.status(404).json({ success: false, error: 'No agents found for the provided UID' });
            return;
        }

        res.status(200).json({ success: true, agents });
    } catch (err) {
        console.error('Error fetching agents with configs:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
export const GetPublishedAgents = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const uid = req.query.uid as string;
    const search = (req.query.search as string || '').trim().toLowerCase();

    try {
        const store = db.collection('store');

        const pipeline: any[] = [
            { $match: { type: 'agent' } },
            {
                $lookup: {
                    from: 'agents',
                    localField: 'info.aid',
                    foreignField: 'aid',
                    as: 'agent'
                }
            },
            { $unwind: '$agent' }
        ];

        if (category) {
            pipeline.push({ $match: { 'info.categories': category } });
        }

        if (uid) {
            pipeline.push({ $match: { 'owner.uid': uid } });
        }

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { 'agent.name': { $regex: search, $options: 'i' } },
                        { 'agent.handle': { $regex: search, $options: 'i' } },
                        { 'info.tags': { $elemMatch: { $regex: search, $options: 'i' } } }
                    ]
                }
            });
        }

        pipeline.push(
            {
                $project: {
                    publish_id: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    agent: {
                        aid: '$agent.aid',
                        name: '$agent.name',
                        description: '$agent.description',
                        image: '$agent.image',
                        handle: '$agent.handle',
                        categories: '$info.categories',
                        tags: '$info.tags'
                    },
                    owner: 1 // keep raw owner object from store
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        );

        const result = await store.aggregate(pipeline).toArray();
        res.status(200).json({ agents: result });
    } catch (e) {
        console.log(e);
        res.status(400).json({ error: 'Something went wrong' });
    }
};
