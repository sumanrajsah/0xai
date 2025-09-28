import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { v7 as uuidv7 } from 'uuid';
export const Publish = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const data = req.body;
    console.log(data)
    const user = (req as any).user

    if (data.address !== user.address) {
        res.status(403).json({ error: "Forbidden: Unauthorized access" });
        return;
    }
    try {
        const store = db.collection('store');
        const agent = db.collection('agents');
        const mc_servers = db.collection('mcp_servers');
        const agent_config = db.collection('agent_config');


        const existing = await store.findOne({ 'info.aid': data.aid })
        if (existing) {
            if (existing.info.config_id !== data.config_id) {
                agent_config.updateMany({ config_id: data.config_id }, { $set: { status: 'published', updatedAt: Date.now() } })
                agent_config.updateMany({ config_id: existing.info.config_id }, { $set: { status: 'draft', updatedAt: Date.now() } })
            }
            agent_config.updateMany({ config_id: data.config_id }, { $set: { updatedAt: Date.now() } })
            const updateFields: any = {};

            // compare and only add if changed
            if (existing.info.config_id !== data.config_id) {
                updateFields['info.config_id'] = data.config_id;
            }
            if (existing.info.categories?.toString() !== data.categories?.toString()) {
                updateFields['info.categories'] = data.categories;
            }
            if (existing.info.tags?.toString() !== data.tags?.toString()) {
                updateFields['info.tags'] = data.tags;
            }
            updateFields.updatedAt = Date.now();

            if (Object.keys(updateFields).length > 1) { // means some field changed
                await store.updateMany(
                    { 'info.aid': data.aid },
                    { $set: updateFields }
                );
            } else {
                res.json({ message: "Agent already published" }).status(200);
                return;
            }
            res.json({ message: "Agent republished" }).status(200);
            return;
        }
        const updateAgent = agent.updateMany({ aid: data.aid }, { $set: { status: 'published', updatedAt: Date.now() } })
        const updateAgentConfig = agent_config.updateMany({ config_id: data.config_id }, { $set: { status: 'published', updatedAt: Date.now() } })

        const publishdata = {
            publish_id: `publish_${uuidv7()}`,
            type: 'agent',
            info: {
                aid: data.aid,
                config_id: data.config_id,
                categories: data.categories,
                tags: data.tags
            },
            status: 'active',
            owner: {
                address: data.address
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        const publish = await store.insertOne(publishdata);

        if (publish) {
            res.json({ message: "Agent published" }).status(200);
            return;
        }


        res.json({ message: "something went wrong" }).status(400);
    } catch (e) {
        console.log(e)
        res.status(400).json({ error: 'Invalid ID' });
    }
};