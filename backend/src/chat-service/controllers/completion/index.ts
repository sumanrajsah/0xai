import dotenv from 'dotenv';
dotenv.config();
import { v7 as uuidv7 } from 'uuid';
import { Request, Response } from 'express';
import { Search, web_search } from '../../../utils/webSearch';
import { getAiModels } from '../../../utils/model';
import { McpClient } from '../../../utils/mcpClient';

type MessageContentItem =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: string }
    | {
        type: 'file'; file: {
            filename: string,
            file_data: string,
            file_url?: string
        }
    }
    | string;

interface ChatConfig {
    model: "gpt-4o-mini" | "gpt-4o";
    temperature: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
    supportsMedia: boolean;
    tools?: string[];
    mcp_server?: any[];
    mcp_tools?: any[];
}

interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content?: MessageContentItem[];
    tool_calls?: any[];
    tool_call_id?: string;
}

async function generateResponse(
    db: any,
    redis: any,
    role: "system" | "user" | "assistant" | "tool",
    userInput: MessageContentItem[],
    history: ChatMessage[],
    config: ChatConfig
): Promise<any> {
    const currentTime = new Date().toString();
    let systemText = `You are a helpful assistant. The current date is ${currentTime}. Answer based on this.`;

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

    let messages: ChatMessage[] = [
        { role: "system", content: [{ type: "text", text: systemText }] },
        ...history,
        { role: role, content: userInput }
    ];

    // Validate message content to prevent undefined content
    messages = messages.filter(msg => msg.content && msg.content.length > 0);

    // Initialize MCP connections with safer defaults
    let connectionResults: any[] = [];
    try {
        connectionResults = await Promise.all(
            (config?.mcp_server ?? []).map(async (endpoint: any) => {
                try {
                    return await McpClient(db, endpoint, config?.mcp_tools ?? []);
                } catch (mcpError) {
                    console.error('MCP Connection Error for endpoint:', endpoint, mcpError);
                    return { tools: [], mcpClient: null, error: mcpError };
                }
            })
        );
    } catch (error) {
        console.error('Error initializing MCP connections:', error);
        connectionResults = [];
    }

    const tools = connectionResults.flatMap((result: any) => result.tools || []);
    let customTools: any[] = [];

    if (config.tools && config.tools.includes('web_search')) {
        customTools.push(web_search);
    }

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

    console.log('Making API request to:', modelConfig.url);

    const result = await fetch(modelConfig.url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${modelConfig.apiKey}`
        },
        body: JSON.stringify(modelConfig.payload)
    });

    if (!result.ok) {
        const errorText = await result.text();
        console.error(`API request failed: ${result.status} ${result.statusText}`, errorText);
        throw new Error(`API request failed: ${result.status} ${result.statusText}: ${errorText}`);
    }

    const response = await result.json();

    // Handle tool calls if present
    if (response.choices && response.choices[0]?.message?.tool_calls) {
        const toolCalls = response.choices[0].message.tool_calls;
        let toolResults = [];

        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

            if (functionName === "web_search") {
                try {
                    const searchResults = await Search(args);
                    toolResults.push({
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(searchResults)
                    });
                } catch (error) {
                    console.error('Web search error:', error);
                    toolResults.push({
                        tool_call_id: toolCall.id,
                        content: `Error performing web search: ${error}`
                    });
                }
            } else {
                // Handle MCP tools
                const clientsWithTool = connectionResults
                    .filter(({ tools }: any) => tools && tools.some((t: any) => t.function && t.function.name === functionName))
                    .map(({ mcpClient }: any) => mcpClient)
                    .filter((client: any) => client !== null);

                if (clientsWithTool.length > 0) {
                    try {
                        const toolResult: any = await clientsWithTool[0].callTool({
                            name: functionName,
                            arguments: args
                        });

                        toolResults.push({
                            tool_call_id: toolCall.id,
                            content: toolResult.content?.[0]?.text || JSON.stringify(toolResult)
                        });
                    } catch (error) {
                        console.error('MCP tool execution error:', error);
                        toolResults.push({
                            tool_call_id: toolCall.id,
                            content: `Error executing tool: ${error}`
                        });
                    }
                } else {
                    toolResults.push({
                        tool_call_id: toolCall.id,
                        content: `Tool ${functionName} not found or not available`
                    });
                }
            }
        }

        // Add tool results to messages and make another API call
        messages.push({
            role: "assistant",
            content: [{ type: "text", text: response.choices[0].message.content || "" }],
            tool_calls: toolCalls
        });

        for (const toolResult of toolResults) {
            if (toolResult.content) {
                messages.push({
                    role: "tool",
                    content: [{ type: "text", text: toolResult.content }],
                    tool_call_id: toolResult.tool_call_id
                });
            }
        }

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

        const finalResult = await fetch(finalModelConfig.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${finalModelConfig.apiKey}`
            },
            body: JSON.stringify(finalModelConfig.payload)
        });

        if (!finalResult.ok) {
            const errorText = await finalResult.text();
            console.error(`Final API request failed: ${finalResult.status} ${finalResult.statusText}`, errorText);
            throw new Error(`Final API request failed: ${finalResult.status} ${finalResult.statusText}: ${errorText}`);
        }

        return await finalResult.json();
    }

    return response;
}

export const Chat = async (req: Request, res: Response): Promise<void> => {
    try {
        const db = req.app.locals.db;
        const redis = req.app.locals.redis;
        const { chat_id, messageData, config } = req.body;

        console.log('Chat request body:', req.body);
        console.log('DB available:', !!db);
        console.log('Redis available:', !!redis);

        // Validate required fields
        if (!messageData || !messageData.content) {
            res.status(400).json({
                success: false,
                error: 'messageData and messageData.content are required'
            });
            return;
        }

        if (!config) {
            res.status(400).json({
                success: false,
                error: 'config is required'
            });
            return;
        }

        // Validate config model
        if (!['gpt-4o-mini', 'gpt-4o'].includes(config.model)) {
            res.status(400).json({
                success: false,
                error: 'Invalid model specified'
            });
            return;
        }

        console.log('Config model:', config.model);
        console.log('Message content:', messageData.content);

        console.log('Generating response...');
        const response = await generateResponse(
            db,
            redis,
            "user",
            messageData.content,
            [], // Empty history for now - you can implement history retrieval if needed
            config
        );

        console.log('Response from AI:', response);

        // Check if response has expected structure
        if (!response.choices || !response.choices[0] || !response.choices[0].message) {
            console.error('Unexpected response structure:', response);
            res.status(500).json({
                success: false,
                error: 'Unexpected response structure from AI model'
            });
            return;
        }

        const assistantMessage = response.choices[0].message;
        console.log('Assistant message:', assistantMessage);

        res.json({
            success: true,
            message: {
                role: "assistant",
                content: assistantMessage.content,
                msg_id: `msg_${uuidv7()}`,
                created: Date.now()
            }
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};