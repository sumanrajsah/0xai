import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { v7 as uuidv7 } from 'uuid';
export const saveServer = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const data = req.body;
    console.log(data)

    try {
        const mcp_servers = db.collection('mcp_servers')
        const userData: ServerInfo = {
            label: data.servers.label,
            description: data.servers.description,
            sid: `mcp_${uuidv7()}`,
            address: data.address,
            serverType: 'mcp',
            auth: data.servers.auth,
            config: {
                type: data.servers.type,
                url: data.servers.uri,
                header: {
                    key: data.servers.header.key,
                    value: data.servers.header.value
                }
            },
            created_on: Date.now(),
            updated_on: Date.now(),
            tools: data.servers.tools

        }
        const adding = await mcp_servers.insertOne(userData);
        if (adding.acknowledged) {
            res.json({ message: "success" }).status(200);
            return;
        }

        res.json({ message: "something went wrong" }).status(400);
    } catch (e) {
        console.log(e)
        res.status(400).json({ error: 'Invalid ID' });
    }
};