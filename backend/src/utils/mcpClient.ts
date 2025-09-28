import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

interface Tools {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: any;
    };
}

async function getMcpServerDetails(db: any, redis: any, serverId: string) {


    try {
        // 1. Check Redis fir

        // 2. Fallback to MongoDB
        const mcp_servers = db.collection('mcp_servers');
        const mcp = await mcp_servers.findOne({ sid: serverId });

        if (!mcp) {
            return {
                success: false,
                data: 'not found'
            };
        }

        // 3. Save to Redis for 1 hour


        return {
            success: true,
            data: mcp
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            data: 'something went wrong'
        };
    }
}


export async function McpClient(db: any, redis: any, server: any, allowedTools: any[]) {
    // console.log(server)
    const serverInfo = await getMcpServerDetails(db, redis, server)
    if (!serverInfo.success) {
        throw new Error("Missing required server information (authKey or URI).");
    }
    let mcpClient = new Client({ name: "mcp-client-cli", version: "1.0.0" });
    const headers: HeadersInit = {};

    try {
        const s: ServerInfo = serverInfo.data;
        // Ensure that server info contains authKey and uri
        if (!s.config.url) {
            throw new Error("Missing required server information (authKey or URI).");
        }

        // console.log("Server Info:", serverInfo);
        if (s.auth) {
            headers[s.config.header.key] = `Bearer ${s.config.header.value}`;
        }

        // Set up HTTP transport
        let transport;
        if (s.config.type === 'http') {
            transport = new StreamableHTTPClientTransport(
                new URL(String(s.config.url)),
                {
                    requestInit: {
                        headers
                    },
                }
            );
        } else {
            transport = new SSEClientTransport(
                new URL(String(s.config.url)),
                {
                    requestInit: {
                        headers
                    },
                }
            );
        }
        // Connect to the transport - this returns a promise
        await mcpClient.connect(transport);

        // Wait a bit for connection to stabilize (optional)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch tools from the server
        let toolsResult;
        try {
            toolsResult = await mcpClient.listTools();
        } catch (error: any) {
            throw new Error(`Failed to fetch tools: ${error.message}`);
        }

        // Fetch resources from the server
        let resourcesResult;
        let resources: any = [];
        try {
            resourcesResult = await mcpClient.listResources();
            resources = resourcesResult.resources.map(resource => ({
                uri: resource.uri,
                name: resource.name,
                description: resource.description,
                mimeType: resource.mimeType
            }));
        } catch (error: any) {
            console.warn("Failed to fetch resources:", error.message);
            // Resources are optional, so we continue without them
        }

        // console.log("Resources:", resources);
        // console.log("Connected to server with tools:", toolsResult.tools.map((tool: { name: string }) => tool.name));

        if (allowedTools.length > 0) {
            const mappedTools: Tools[] = toolsResult.tools
                .filter((tool: any) => allowedTools.includes(tool.name))
                .map((tool: any) => ({
                    type: "function" as const,
                    function: {
                        name: tool.name,
                        description: tool.description ?? "",
                        parameters: tool.inputSchema
                    }
                }));

            return { tools: mappedTools, mcpClient, resources };
        } else {
            const tools: Tools[] = toolsResult.tools.map((tool: any) => ({
                type: "function" as const,
                function: {
                    name: tool.name,
                    description: tool.description ?? "", // Ensuring it's always a string
                    parameters: tool.inputSchema
                }
            }));

            return { tools, mcpClient, resources };
        }

    } catch (error: any) {
        console.error("MCP Connection Error:", error.message);

        // Clean up the client if connection failed
        try {
            await mcpClient.close();
        } catch (closeError) {
            console.warn("Error closing client:", closeError);
        }

        return { tools: [], mcpClient: null, error: error.message, resources: [] };
    }
}

// Helper function to properly close the MCP connection
export async function closeMCPConnection(mcpClient: Client | null) {
    if (mcpClient) {
        try {
            await mcpClient.close();
        } catch (error) {
            console.warn("Error closing MCP client:", error);
        }
    }
}