import { Request, Response } from 'express';

export const getServerById = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const { uid, sid } = req.query;
    // console.log(uid, sid)

    try {
        const mcp_servers = db.collection('mcp_servers');
        if (uid) {
            const mcp = await mcp_servers
                .find({ uid })
                .toArray();

            //console.log(mcp)
            if (!mcp) {
                res.status(404).json({ error: 'mcp not found' });
                return;
            }

            res.status(200).json({ message: 'Success', data: mcp });
        } else {
            const mcp = await mcp_servers.findOne({ sid });
            //console.log(mcp)
            if (!mcp) {
                res.status(404).json({ error: 'mcp not found' });
                return;
            }

            res.status(200).json({ message: 'Success', data: mcp });
        }
    } catch (error) {
        //console.error('Error fetching mcp by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
