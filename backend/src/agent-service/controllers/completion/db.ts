import { error } from "console";
import { generateResponseNormalWithoutStream } from "./response";


export const getAgentByAid = async (
    db: any,
    redis: any,
    aid: string,
    uid: string
): Promise<any> => {
    try {
        // 1. Try to get agent from Redis
        // const cached = await redis.get(`agentChat:${aid}`);
        // if (cached) {
        //     if (uid !== JSON.parse(cached).uid && JSON.parse(cached).status === 'draft') {
        //         throw new Error('Unauthorized access');
        //     }
        //     return { success: true, agent: JSON.parse(cached) };
        // }

        // 2. Fetch from MongoDB if not in Redis
        const agent = await db.collection('agents').aggregate([
            {
                $match: { aid }
            },
            {
                $lookup: {
                    from: 'agent_config',
                    let: { agentAid: '$aid' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$aid', '$$agentAid'] } } },
                        { $sort: { version: -1 } }, // Sort by version descending
                        { $limit: 1 } // Only the latest
                    ],
                    as: 'config'
                }
            },
            {
                $set: {
                    config: { $first: '$config.config' } // Convert array to object
                }
            }
        ]).toArray();

        if (!agent) {
            return { success: false }
        }
        console.log(JSON.stringify(agent[0]))
        // 3. Cache the result in Redis for 1 hour
        await redis.set(`agent:${aid}`, JSON.stringify(agent[0]), {
            EX: 3600 // 1 hour
        });
        if (uid !== agent.uid && agent.status === 'draft') {
            throw new Error('Unauthorized access');
        }

        // 4. Return the result
        return { success: true, agent: agent[0] };
    } catch (error) {
        console.error('❌ getAgentById error:', error);
        throw new Error('Failed to fetch agent');
    }
};
export const getPublishedAgentByAid = async (
    db: any,
    redis: any,
    aid: string,
    uid: string
): Promise<any> => {
    try {
        // 1. Try to get agent from Redis
        // const cached = await redis.get(`publishedAgentPricing:${aid}`);
        // if (cached) {
        //     if (uid !== JSON.parse(cached).uid && JSON.parse(cached).status === 'draft') {
        //         throw new Error('Unauthorized access');
        //     }
        //     return { success: true, agent: JSON.parse(cached) };
        // }

        // 2. Fetch from MongoDB if not in Redis
        const agent = await db.collection('store').findOne({ 'info.aid': aid });

        if (!agent) {
            return { success: false }
        }
        console.log(JSON.stringify(agent))
        // 3. Cache the result in Redis for 1 hour
        await redis.set(`agent:${aid}`, JSON.stringify(agent), {
            EX: 3600 // 1 hour
        });
        if (uid !== agent.uid && agent.status !== 'active') {
            throw new Error('Unauthorized access');
        }

        // 4. Return the result
        return { success: true, agent: agent };
    } catch (error) {
        console.error('❌ getAgentById error:', error);
        throw new Error('Failed to fetch agent');
    }
};
