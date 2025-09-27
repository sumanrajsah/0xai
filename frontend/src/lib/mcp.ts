import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

interface Tools {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: any;
    }
}

export async function MCP(serverInfo: any) {
    let mcpClient = new Client({ name: "mcp-client-cli", version: "1.0.0" });
    const headers: HeadersInit = {};
    console.log("Connecting to MCP server with info:", serverInfo);

    try {
        if (!serverInfo?.uri) {
            throw new Error("Missing required server information (authKey or URI).");
        }

        // Add authorization header if authKey is provided
        if (serverInfo.auth) {
            headers[serverInfo.header.key] = `Bearer ${serverInfo.header.value}`;
        }

        let transport;
        if (serverInfo.type === 'http') {
            transport = new StreamableHTTPClientTransport(
                new URL(String(serverInfo.uri)),
                {
                    requestInit: {
                        headers
                    },
                }
            );
        } else {
            transport = new SSEClientTransport(
                new URL(String(serverInfo.uri)),
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

        console.log("Resources:", resources);
        console.log("Connected to server with tools:", toolsResult.tools.map(({ name }) => name));

        const tools: Tools[] = toolsResult.tools.map(tool => ({
            type: "function" as const,
            function: {
                name: tool.name,
                description: tool.description ?? "", // Ensuring it's always a string
                parameters: tool.inputSchema
            }
        }));

        return { tools, mcpClient, resources, error: null };

    } catch (error: any) {
        console.warn("MCP Connection Error:", error.message);

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