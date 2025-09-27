import dotenv from 'dotenv';
dotenv.config();
import { v7 as uuidv7 } from 'uuid';
import { Request, Response } from 'express';
import { Search, web_search } from '../../../utils/webSearch';
import { getAiModels } from '../../../utils/model';
import { McpClient } from '../../../utils/mcpClient';

// Debug logger utility
const debug = {
    log: (message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        console.log(`[DEBUG ${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    error: (message: string, error?: any) => {
        const timestamp = new Date().toISOString();
        console.error(`[ERROR ${timestamp}] ${message}`, error);
    },
    warn: (message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        console.warn(`[WARN ${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
};

interface ChatConfig {
    model: "gpt-4o-mini" | "gpt-4o";
    temperature: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
    supportsMedia: boolean;
    tools: string[];
    mcp_server: any[];
    mcp_tools: any[];
}

interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content?: MessageContentItem[] | string;
    tool_calls?: any[];
    tool_call_id?: string;
}

interface ToolResult {
    tool_call_id: string;
    content: string;
}

async function generateResponse(
    db: any,
    redis: any,
    role: "system" | "user" | "assistant" | "tool",
    userInput: MessageContentItem[],
    history: ChatMessage[],
    config: ChatConfig
): Promise<any> {
    debug.log("Starting generateResponse", {
        role,
        userInputLength: userInput?.length,
        historyLength: history?.length,
        config: {
            model: config.model,
            tools: config.tools,
            mcpServerCount: config.mcp_server?.length || 0
        }
    });

    try {
        const currentTime = new Date().toString();
        let systemText = `You are a helpful assistant. The current date ${currentTime}. Answer based on this.`;

        if (config.tools && config.tools.includes("web_search")) {
            systemText += `

When you receive search results from the "web_search" tool, use them to ground your answer.
- Insert inline numbered citations like [1], [2], etc. wherever you use information from a source.
- At the end, add a "Sources:" section.
- In "Sources", use a numbered list where each number matches the inline citation.
- Format each source as the page title with an underlined Markdown hyperlink.
  Example:

  Sources:
  1. [_Blockchain.com_](https://www.blockchain.com/)
  2. [_CoinDesk_](https://www.coindesk.com/)

If the search results are empty or irrelevant, state clearly that no useful information was found instead of guessing.
Always perform at least one "web_search" query before answering any user question.`;
        }

        // Normalize content format
        const normalizedUserInput = Array.isArray(userInput) ? userInput : [{ type: 'text', text: String(userInput) }];

        let messages = [
            { role: "system", content: [{ type: "text", text: systemText }] },
            ...history,
            { role: role, content: normalizedUserInput }
        ];

        debug.log("Messages prepared", { messageCount: messages.length });

        // Initialize MCP connections
        debug.log("Initializing MCP connections", { mcpServerCount: config?.mcp_server?.length || 0 });

        const connectionResults = await Promise.allSettled(
            (config?.mcp_server ?? []).map(async (endpoint: any, index: number) => {
                try {
                    debug.log(`Connecting to MCP server ${index}`, endpoint);
                    const result = await McpClient(db, endpoint, config.mcp_tools ?? []);
                    debug.log(`MCP server ${index} connected successfully`, { toolCount: result.tools?.length || 0 });
                    return result;
                } catch (error) {
                    debug.error(`Failed to connect to MCP server ${index}`, error);
                    throw error;
                }
            })
        );

        // Filter successful connections and extract tools
        const tools = connectionResults
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
            .flatMap((result: any) => result.value.tools || []);

        // Log failed connections
        connectionResults
            .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
            .forEach((result, index) => {
                debug.error(`MCP connection ${index} failed`, result.reason);
            });

        let customTools: any[] = [];

        if (config.tools && config.tools.includes('web_search')) {
            customTools.push(web_search);
            debug.log("Added web_search tool");
        }

        debug.log("Tools prepared", {
            mcpToolCount: tools.length,
            customToolCount: customTools.length
        });

        const modelConfig = await getAiModels(
            config.model,
            messages,
            [...tools, ...customTools],
            config.temperature,
            config.top_p,
            config.frequency_penalty,
            config.presence_penalty,
            config.supportsMedia
        );

        debug.log("Model config prepared", {
            url: modelConfig.url,
            model: modelConfig.payload?.model,
            messageCount: modelConfig.payload?.messages?.length
        });

        const result = await fetch(modelConfig.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${modelConfig.apiKey?.substring(0, 10)}...`
            },
            body: JSON.stringify(modelConfig.payload)
        });

        if (!result.ok) {
            const errorText = await result.text();
            debug.error("Initial API request failed", {
                status: result.status,
                statusText: result.statusText,
                errorText
            });
            throw new Error(`API request failed: ${result.status} ${result.statusText} - ${errorText}`);
        }

        const response = await result.json();
        debug.log("Initial API response received", {
            hasToolCalls: !!response.choices[0]?.message?.tool_calls,
            toolCallCount: response.choices[0]?.message?.tool_calls?.length || 0
        });

        // Handle tool calls if present
        if (response.choices[0]?.message?.tool_calls) {
            const toolCalls = response.choices[0].message.tool_calls;
            debug.log("Processing tool calls", { count: toolCalls.length });

            let toolResults: ToolResult[] = [];

            for (const [index, toolCall] of toolCalls.entries()) {
                const functionName = toolCall.function.name;
                let args;

                try {
                    args = JSON.parse(toolCall.function.arguments);
                    debug.log(`Processing tool call ${index}: ${functionName}`, args);
                } catch (error) {
                    debug.error(`Failed to parse tool arguments for ${functionName}`, {
                        arguments: toolCall.function.arguments,
                        error
                    });
                    toolResults.push({
                        tool_call_id: toolCall.id,
                        content: `Error: Invalid tool arguments - ${error}`
                    });
                    continue;
                }

                if (functionName === "web_search") {
                    try {
                        debug.log("Executing web search", args);
                        const searchResults = await Search(args);
                        debug.log("Web search completed", {
                            resultCount: Array.isArray(searchResults) ? searchResults.length : 0
                        });

                        toolResults.push({
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(searchResults)
                        });
                    } catch (error) {
                        debug.error("Web search failed", error);
                        toolResults.push({
                            tool_call_id: toolCall.id,
                            content: `Error executing web search: ${error}`
                        });
                    }
                } else {
                    // Handle MCP tools
                    debug.log(`Looking for MCP tool: ${functionName}`);

                    const clientsWithTool = connectionResults
                        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
                        .filter(({ value }: any) => value.tools?.some((t: any) => t.function?.name === functionName))
                        .map(({ value }: any) => value.mcpClient)
                        .filter((client: any) => client !== null);

                    if (clientsWithTool.length > 0) {
                        try {
                            debug.log(`Executing MCP tool: ${functionName}`);
                            const toolResult: any = await clientsWithTool[0].callTool({
                                name: functionName,
                                arguments: args
                            });

                            debug.log(`MCP tool ${functionName} executed successfully`);

                            toolResults.push({
                                tool_call_id: toolCall.id,
                                content: toolResult.content?.[0]?.text || JSON.stringify(toolResult)
                            });
                        } catch (error) {
                            debug.error(`MCP tool ${functionName} execution failed`, error);
                            toolResults.push({
                                tool_call_id: toolCall.id,
                                content: `Error executing tool: ${error}`
                            });
                        }
                    } else {
                        debug.warn(`Tool ${functionName} not found in any MCP client`);
                        toolResults.push({
                            tool_call_id: toolCall.id,
                            content: `Error: Tool ${functionName} not found`
                        });
                    }
                }
            }

            debug.log("All tool calls processed", { resultCount: toolResults.length });

            // Add tool results to messages and make another API call
            messages.push({
                role: "assistant",
                tool_calls: toolCalls
            });

            for (const toolResult of toolResults) {
                messages.push({
                    role: "tool",
                    content: [{ type: "text", text: toolResult.content }],
                    tool_call_id: toolResult.tool_call_id
                });
            }

            debug.log("Messages updated with tool results", { totalMessages: messages.length });

            // Make final API call with tool results
            const finalModelConfig = await getAiModels(
                config.model,
                messages,
                [...tools, ...customTools],
                config.temperature,
                config.top_p,
                config.frequency_penalty,
                config.presence_penalty,
                config.supportsMedia
            );

            debug.log("Making final API call with tool results");

            const finalResult = await fetch(finalModelConfig.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${finalModelConfig.apiKey?.substring(0, 10)}...`
                },
                body: JSON.stringify(finalModelConfig.payload)
            });

            if (!finalResult.ok) {
                const errorText = await finalResult.text();
                debug.error("Final API request failed", {
                    status: finalResult.status,
                    statusText: finalResult.statusText,
                    errorText
                });
                throw new Error(`Final API request failed: ${finalResult.status} ${finalResult.statusText} - ${errorText}`);
            }

            const finalResponse = await finalResult.json();
            debug.log("Final API response received successfully");
            return finalResponse;
        }

        debug.log("No tool calls, returning initial response");
        return response;

    } catch (error) {
        debug.error("Error in generateResponse", error);
        throw error;
    }
}

export const Chat = async (req: Request, res: Response): Promise<void> => {
    const requestId = uuidv7();
    debug.log(`Starting chat request ${requestId}`, {
        body: {
            chat_id: req.body?.chat_id,
            hasMessageData: !!req.body?.messageData,
            hasConfig: !!req.body?.config
        }
    });

    try {
        // Validate request body
        if (!req.body) {
            debug.error(`Request ${requestId}: Missing request body`);
            res.status(400).json({
                success: false,
                error: 'Request body is required'
            });
            return;
        }

        const db = req.app.locals.db;
        const redis = req.app.locals.redis;
        const { chat_id, messageData, config } = req.body;

        // Validate required fields
        if (!messageData || !messageData.content) {
            debug.error(`Request ${requestId}: Missing messageData or content`);
            res.status(400).json({
                success: false,
                error: 'messageData with content is required'
            });
            return;
        }

        if (!config) {
            debug.error(`Request ${requestId}: Missing config`);
            res.status(400).json({
                success: false,
                error: 'config is required'
            });
            return;
        }

        debug.log(`Request ${requestId}: Generating response`);

        const response = await generateResponse(
            db,
            redis,
            "user",
            messageData.content,
            [], // Empty history for now - you can implement history retrieval if needed
            config
        );

        const assistantMessage = response.choices?.[0]?.message;

        if (!assistantMessage) {
            debug.error(`Request ${requestId}: No assistant message in response`, response);
            res.status(500).json({
                success: false,
                error: 'No response generated from AI model'
            });
            return;
        }

        const responseData = {
            success: true,
            message: {
                role: "assistant",
                content: assistantMessage.content,
                msg_id: `msg_${uuidv7()}`,
                created: Date.now()
            }
        };

        debug.log(`Request ${requestId}: Success`, {
            hasContent: !!assistantMessage.content,
            contentLength: typeof assistantMessage.content === 'string'
                ? assistantMessage.content.length
                : JSON.stringify(assistantMessage.content).length
        });

        res.json(responseData);

    } catch (error: any) {
        debug.error(`Request ${requestId}: Failed`, error);

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            requestId: requestId // Include request ID for tracking
        });
    }
};