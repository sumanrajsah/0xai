import { Request, Response } from 'express';
import { v7 as uuidv7 } from 'uuid';
import { McpClient } from '../../../utils/mcpClient';
import { Search, web_search } from '../../../utils/webSearch';
import { getAiModels } from '../../../utils/model';


interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content?: MessageContentItem[];
    name?: string;
    tool_calls?: any[];
    tool_call_id?: string;
}

async function generateResponse(
    db: any,
    role: "system" | "user" | "assistant" | "tool",
    userInput: MessageContentItem[],
    history: ChatMessage[],
    config: any,
    signal?: AbortSignal,
    tool_call_id?: string
): Promise<{ response?: string; toolCalls?: any[]; needsToolExecution?: boolean }> {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🚀 [${traceId}] generateResponse started`, {
        role,
        userInputLength: userInput?.length || 0,
        historyLength: history?.length || 0,
        model: config?.model
    });

    // Build system message
    const currentTime = new Date().toString();
    let systemText = `You are a helpful assistant. The current date is ${currentTime}.`;

    if (config.tools?.includes("web_search")) {
        systemText += `

When you receive search results from the "web_search" tool, use them to ground your answer.
- Insert inline numbered citations like [1], [2], etc. wherever you use information from a source.
- At the end, add a "Sources:" section.
- In "Sources", use a numbered list where each number matches the inline citation.
- Format each source as the page title with an underlined Markdown hyperlink.

If the search results are empty or irrelevant, state clearly that no useful information was found.
Always perform at least one "web_search" query before answering any user question.`;
    }

    // Build messages array
    let messages: ChatMessage[] = [
        { role: "system", content: [{ type: "text", text: systemText }] },
        ...history,
        tool_call_id
            ? { role: role, content: userInput, tool_call_id }
            : { role: role, content: userInput },
    ];

    try {
        // Initialize MCP connections to get available tools
        console.log(`🔌 [${traceId}] Initializing MCP connections`);
        const connectionResults = await Promise.all(
            (config?.mcp_server ?? []).map(async (item: any, index: number) => {
                const sid = item.sid
                console.log(`🔗 [${traceId}] Connecting to MCP server ${index}`, { item });
                const result = await McpClient(db, sid, config.mcp_tools ?? []);
                console.log(`✅ [${traceId}] MCP server ${index} connected`, {
                    toolsCount: result?.tools?.length || 0
                });
                return result;
            })
        );

        const mcpTools = connectionResults.flatMap(result => result.tools);
        const customTools = [web_search];
        const allTools = [...mcpTools, ...customTools];

        console.log(`🛠️ [${traceId}] Tools available:`, allTools.map(t => t.function?.name));

        // Get AI model configuration
        const modelConfig = await getAiModels(
            config.model,
            messages,
            allTools,
            config.temperature,
            config.top_p,
            config.frequency_penalty,
            config.presence_penalty,
            config.supportsMedia
        );

        // Make API request
        console.log(`📡 [${traceId}] Making API request to ${modelConfig.provider}`);
        const result = await fetch(modelConfig.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${modelConfig.apiKey}`
            },
            body: JSON.stringify(modelConfig.payload),
            signal: signal
        });
        console.log(result)

        if (!result.ok) {
            const errorText = await result.text();
            console.error(`❌ [${traceId}] API request failed:`, errorText);
            throw new Error(`API request failed: ${result.status} ${result.statusText}`);
        }

        // Parse response
        const responseData = await result.json();
        const choice = responseData.choices?.[0];

        if (!choice) {
            throw new Error('No valid response from AI model');
        }

        let fullResponse = "";
        const toolCalls = choice.message?.tool_calls || [];

        // Handle regular text response
        if (choice.message?.content) {
            fullResponse = choice.message.content;
        }

        // Handle tool calls
        if (toolCalls.length > 0) {
            console.log(`🛠️ [${traceId}] Processing ${toolCalls.length} tool calls`);

            // Check if any tool calls are for MCP tools (not web_search)
            const hasMcpTools = toolCalls.some((toolCall: { function: { name: string; }; }) =>
                toolCall.function.name !== "web_search"
            );

            // If there are MCP tools, return them to frontend for execution
            if (hasMcpTools) {
                console.log(`🔄 [${traceId}] Returning MCP tool calls to frontend`);
                return {
                    response: fullResponse,
                    toolCalls: toolCalls,
                    needsToolExecution: true
                };
            }

            // Only execute web_search tools on backend
            const webSearchCalls = toolCalls.filter((toolCall: { function: { name: string; }; }) =>
                toolCall.function.name === "web_search"
            );

            if (webSearchCalls.length > 0) {
                // Add assistant message with tool calls to history
                history.push({
                    role: 'assistant',
                    content: fullResponse ? [{ type: 'text', text: fullResponse }] : undefined,
                    tool_calls: toolCalls
                });

                // Process web search tool calls
                for (const toolCall of webSearchCalls) {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`🔍 [${traceId}] Executing web search`);

                    try {
                        const searchResults = await Search(args);
                        const toolResult = JSON.stringify(searchResults);

                        // Add tool result to history
                        history.push({
                            role: "tool",
                            content: [{ type: "text", text: toolResult }],
                            tool_call_id: toolCall.id
                        });

                        console.log(`✅ [${traceId}] Web search executed successfully`);
                    } catch (error: any) {
                        console.error(`❌ [${traceId}] Web search failed:`, error.message);

                        // Add error result to history
                        history.push({
                            role: "tool",
                            content: [{ type: "text", text: `Error: ${error.message}` }],
                            tool_call_id: toolCall.id
                        });
                    }
                }

                // Make another API call to get final response with tool results
                console.log(`🔄 [${traceId}] Making follow-up API call with tool results`);
                const followUpConfig = await getAiModels(
                    config.model,
                    history,
                    allTools,
                    config.temperature,
                    config.top_p,
                    config.frequency_penalty,
                    config.presence_penalty,
                    config.supportsMedia
                );

                const followUpResult = await fetch(followUpConfig.url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${followUpConfig.apiKey}`
                    },
                    body: JSON.stringify(followUpConfig.payload),
                    signal: signal
                });

                if (followUpResult.ok) {
                    const followUpData = await followUpResult.json();
                    const followUpChoice = followUpData.choices?.[0];
                    if (followUpChoice?.message?.content) {
                        fullResponse = followUpChoice.message.content;
                    }
                }
            }
        }

        console.log(`✅ [${traceId}] Response generated successfully`);
        return { response: fullResponse };

    } catch (error: any) {
        console.error(`❌ [${traceId}] Error generating response:`, error);

        if (error.name === 'AbortError') {
            return { response: "Request was aborted by the user." };
        }

        return { response: `An error occurred while generating the response: ${error}` };
    }
}

export const Chat = async (req: Request, res: Response): Promise<void> => {
    const message = req.body;
    const abortController = (req as any).abortController;
    const signal = abortController?.signal;
    const db = req.app.locals.db;
    console.log(message)

    try {
        // Check if this is a regular chat message or tool results response
        const isToolResultsRequest = message.toolResults && Array.isArray(message.toolResults);

        if (isToolResultsRequest) {
            // Handle tool results from frontend
            console.log('🔧 Processing tool results from frontend');

            const { history, toolResults, config } = message;
            const updatedHistory: ChatMessage[] = [...history];

            // Add tool results to history
            toolResults.forEach((toolResult: any) => {
                updatedHistory.push({
                    role: "tool",
                    content: [{ type: "text", text: toolResult.content }],
                    tool_call_id: toolResult.tool_call_id
                });
            });

            // Generate response with tool results
            const result = await generateResponse(
                db,
                "tool",
                [],
                updatedHistory,
                config,
                signal
            );

            res.json({
                success: true,
                response: result.response,
                msg_id: `msg_${uuidv7()}`,
                created: Date.now(),
                model: {
                    name: config?.model,
                    provider: 'openai'
                }
            });

        } else {
            // Handle regular chat message
            console.log('📝 Processing chat request:', {
                chatId: message.chat_id,
                model: message.config?.model,
                hasTools: !!message.config?.tools?.length
            });

            const chatMessage = message.messageData.content;
            // Simple history structure - in a real app you'd load this from storage
            const history: ChatMessage[] = message.history || [];

            const result = await generateResponse(
                db,
                "user",
                chatMessage,
                history,
                message.config,
                signal
            );

            // If AI wants to call MCP tools, return them to frontend
            if (result.needsToolExecution && result.toolCalls) {
                res.json({
                    success: true,
                    needsToolExecution: true,
                    toolCalls: result.toolCalls,
                    response: result.response,
                    history: [...history, {
                        role: 'assistant',
                        content: result.response ? [{ type: 'text', text: result.response }] : undefined,
                        tool_calls: result.toolCalls
                    }],
                    msg_id: `msg_${uuidv7()}`,
                    created: Date.now(),
                    model: {
                        name: message.config?.model,
                        provider: 'openai'
                    }
                });
                return;
            }

            // Return regular response
            res.json({
                success: true,
                response: result.response,
                msg_id: `msg_${uuidv7()}`,
                created: Date.now(),
                model: {
                    name: message.config?.model,
                    provider: 'openai'
                }
            });
        }

    } catch (error: any) {
        console.error('Chat error:', error);

        if (error.name === 'AbortError') {
            res.status(499).json({
                success: false,
                error: 'Request aborted by client'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }
};