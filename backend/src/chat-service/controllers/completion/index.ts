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
    tools: string[];
    mcp_server: any[];
    mcp_tools: any[];
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
    let systemText = `You are a helpful assistant. The current date ${currentTime}. Answer based on this.`;

    if (config.tools.includes("web_search")) {
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

    // Initialize MCP connections
    const connectionResults = await Promise.all(
        (config?.mcp_server ?? []).map(async (endpoint: any) => {
            return await McpClient(db, endpoint, config.mcp_tools ?? []);
        })
    );

    const tools = connectionResults.flatMap((result: any) => result.tools);
    let customTools: any[] = [];

    if (config.tools.includes('web_search')) {
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
        throw new Error(`API request failed: ${result.status} ${result.statusText}`);
    }

    const response = await result.json();

    // Handle tool calls if present
    if (response.choices[0]?.message?.tool_calls) {
        const toolCalls = response.choices[0].message.tool_calls;
        let toolResults = [];

        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

            if (functionName === "web_search") {
                const searchResults = await Search(args);
                toolResults.push({
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(searchResults)
                });
            } else {
                // Handle MCP tools
                const clientsWithTool = connectionResults
                    .filter(({ tools }: any) => tools.some((t: any) => t.function.name === functionName))
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
                        toolResults.push({
                            tool_call_id: toolCall.id,
                            content: `Error executing tool: ${error}`
                        });
                    }
                }
            }
        }

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
            throw new Error(`Final API request failed: ${finalResult.status} ${finalResult.statusText}`);
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

        const response = await generateResponse(
            db,
            redis,
            "user",
            messageData.content,
            [], // Empty history for now - you can implement history retrieval if needed
            config
        );

        const assistantMessage = response.choices[0]?.message;

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
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};