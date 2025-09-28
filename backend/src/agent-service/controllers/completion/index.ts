import { ReadableStream } from 'stream/web';
import dotenv from 'dotenv';
dotenv.config();
import { v7 as uuidv7 } from 'uuid';
import { Request, Response } from 'express';
import { getAiModels, isModelAvailable } from './models';


import { buildAndTrimMessages, calculateCredits, deductCredits, estimateInputTokens, estimateOutputTokens, estimateToolsTokens, transferCredits } from './credit';
import { McpClient } from '../../../utils/mcpClient';
import { Search, web_search } from '../../../utils/webSearch';
import { getAgentByAid } from './db';



function checkAborted(signal?: AbortSignal, controller?: ReadableStreamDefaultController<Uint8Array>, encoder?: TextEncoder): boolean {
    //console.log(signal)
    if (signal?.aborted) {
        console.log('Request aborted by client');
        if (controller && controller.desiredSize !== null && encoder) {
            try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    response: "Request was aborted",
                    msg_id: `msg_${uuidv7()}`,
                    type: 'abort',
                    created: Date.now()
                })}\n\n`));
                controller.close(); // Close the controller after sending abort message
            } catch (e) {
                console.warn('Failed to enqueue abort message:', e);
            }
        }
        return true;
    }
    return false;
}

function buildMemoryPrompt(memories: { text: string }[]) {
    return memories
        .map((m, i) => `- ${m.text}`)
        .join("\n");
}
async function generateResponse(db: any, redis: any, role: "system" | "user" | "assistant" | "tool", userInput: MessageContentItem[], memories: any[], history: Array<{ role: "system" | "user" | "assistant" | "tool"; content?: MessageContentItem[]; tool_calls?: any[]; tool_call_id?: string; }>, agent: any, config: any, workspace: string, signal?: AbortSignal, uid?: string, chat_id?: any, aid?: any, tool_call_id?: string): Promise<ReadableStream<Uint8Array> | undefined> {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();

    console.log(`🚀 [${traceId}] generateResponse started`, {
        role,
        userInputLength: userInput?.length || 0,
        historyLength: history?.length || 0,
        model: config?.model,
        workspace,
        uid,
        chat_id,
        tool_call_id,
        hasSignal: !!signal, config
    });
    let systemMessageBlock = "";
    if (memories?.length > 0) {
        systemMessageBlock = `
Relevant personal memories:
${buildMemoryPrompt(memories)}

Rules:
- Use only if relevant to answering user's request.
- Do not invent details. 
`;
    }

    const currentTime = new Date(Date.now()).toString();

    let systemText = `You are a helpful assistant. The current date ${currentTime}.${systemMessageBlock} Answer based on this.`;
    systemText += config.instructions;

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
    let messages: Array<{
        role: "system" | "user" | "assistant" | "tool";
        content?: MessageContentItem[];
        name?: string;
        tool_calls?: any[];
        tool_call_id?: string;
    }> = [
            { role: "system", content: [{ 'type': 'text', 'text': systemText }] },
            ...history,
            tool_call_id
                ? { role: role, content: userInput, tool_call_id }
                : { role: role, content: userInput },
        ];
    const { messages: trimmed } = buildAndTrimMessages(
        messages,               // as per the helper’s signature
        role,
        userInput,
        tool_call_id,
        16000
    );

    console.log(history, JSON.stringify(history))
    history = trimmed;
    console.log(history, JSON.stringify(history))

    console.log(`📝 [${traceId}] Messages prepared`, {
        totalMessages: messages.length,
        systemMessage: !!messages.find(m => m.role === 'system'),
        lastMessageRole: messages[messages.length - 1]?.role
    });

    try {
        console.log(`🔌 [${traceId}] Initializing MCP connections`, {
            mcpServersCount: config?.mcp_server?.length || 0
        });

        const connectionResults = await Promise.all(
            (config?.mcp_server ?? []).map(async (item: any, index: number) => {
                const sid = item.sid
                console.log(`🔗 [${traceId}] Connecting to MCP server ${index}`, { item });
                const result = await McpClient(db, redis, sid, config.mcp_tools ?? []);
                console.log(`✅ [${traceId}] MCP server ${index} connected`, {
                    toolsCount: result?.tools?.length || 0
                });
                return result;
            })
        );

        const tools = connectionResults.flatMap(result => result.tools);
        console.log(`🛠️  [${traceId}] Tools aggregated`, {
            totalTools: tools.length,
            toolNames: tools.map((t: any) => t.function?.name).filter(Boolean)
        });

        if (!tools) {
            console.log(`⚠️  [${traceId}] No tools available, exiting early`);
            return;
        }
        let customTools: any[] = [];
        // if (config.tools.includes('image')) {
        //     customTools.push(generate_image)
        // }
        if (config.tools.includes('web_search')) {
            customTools.push(web_search)
        }

        console.log(`🤖 [${traceId}] Getting AI model configuration`, {
            model: config.model,
            temperature: config.temperature,
            supportsMedia: config.supportsMedia,
            history: JSON.stringify(history),
            tools: config.tools
        });

        const modelConfig = await getAiModels(config.model, messages, [...customTools, ...tools], config.temperature, config.top_p, config.frequency_penalty, config.presence_penalty, config.supportsMedia);

        console.log(`📡 [${traceId}] Making API request`, {
            url: modelConfig.url,
            model: config.model,
            provider: modelConfig.provider,
            payloadSize: JSON.stringify(modelConfig.payload).length,
            history
        });

        const fetchStartTime = performance.now();
        const result = await fetch(modelConfig.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${modelConfig.apiKey}`
            },
            body: JSON.stringify(modelConfig.payload),
            signal: signal
        });

        const fetchEndTime = performance.now();
        console.log(`📡 [${traceId}] API request completed`, {
            status: result.status,
            statusText: result.statusText,
            ok: result.ok,
            fetchDuration: `${(fetchEndTime - fetchStartTime).toFixed(2)}ms`
        });

        if (!result.ok) {
            console.error(`❌ [${traceId}] API request failed`, {
                status: result.status,
                statusText: result.statusText
            });

            const errorText = await result.text();
            console.error(`❌ [${traceId}] Error response`, { errorText });

            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    console.log(`🔄 [${traceId}] Creating error stream`);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: JSON.parse(errorText).error.message, msgId: `msg_${uuidv7()}`, type: 'text', created: Date.now() })}\n\n`));
                    controller.close();
                }
            });
            return stream;
        }

        const reader = result.body?.getReader();
        if (!reader) {
            console.error(`❌ [${traceId}] No reader from response stream`);
            throw new Error("No reader from response stream");
        }

        console.log(`🔄 [${traceId}] Starting stream processing`);

        let fullResponse = "";
        let toolCalls: any[] = [];
        let accumulatedArguments: { [key: number]: string } = {};
        let msgIdUuid = uuidv7();
        let msg_id = `msg_${msgIdUuid}`;
        let created = Date.now();
        let tool_id;
        let chunksProcessed = 0;
        let bytesProcessed = 0;

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                const decoder = new TextDecoder();
                let isControllerClosed = false;

                console.log(`🎬 [${traceId}] Stream controller started`);

                const closeController = () => {
                    if (!isControllerClosed) {
                        console.log(`🔚 [${traceId}] Closing stream controller`);
                        controller.close();
                        isControllerClosed = true;
                    }
                };

                let buffer = "";
                let loopIterations = 0;

                while (true) {
                    loopIterations++;

                    if (loopIterations % 100 === 0) {
                        console.log(`🔄 [${traceId}] Stream processing loop iteration ${loopIterations}`, {
                            bufferSize: buffer.length,
                            chunksProcessed,
                            bytesProcessed,
                            fullResponseLength: fullResponse.length
                        });
                    }

                    if (checkAborted(signal) && uid) {
                        console.log(`🛑 [${traceId}] Abort detected during stream reading`, {
                            iteration: loopIterations,
                            partialResponseLength: fullResponse.length
                        });


                        try {
                            await reader.cancel('Request aborted');
                            console.log(`🛑 [${traceId}] Reader cancelled successfully`);
                        } catch (e) {
                            console.warn(`⚠️  [${traceId}] Reader cancel failed:`, e);
                        }
                        break;
                    }

                    let readerResult;
                    try {
                        readerResult = await reader.read();
                    } catch (error) {
                        console.error(`❌ [${traceId}] Reader error:`, error);
                        break;
                    }

                    const { done, value } = readerResult;
                    if (done) {
                        console.log(`✅ [${traceId}] Stream reading completed`, {
                            totalIterations: loopIterations,
                            chunksProcessed,
                            bytesProcessed,
                            finalResponseLength: fullResponse.length
                        });
                        break;
                    }

                    chunksProcessed++;
                    bytesProcessed += value.length;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (checkAborted(signal)) {
                            console.log(`🛑 [${traceId}] Abort detected during line processing`);
                            break;
                        }

                        const trimmed = line.trim();
                        if (!trimmed.startsWith("data:")) continue;

                        const jsonText = trimmed.replace(/^data:\s*/, "");
                        if (jsonText === "[DONE]") {
                            console.log(`🏁 [${traceId}] Received [DONE] signal`);
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(jsonText);
                            msg_id = parsed.id;
                            created = parsed.created;
                            const delta = parsed.choices[0]?.delta;

                            if (delta?.tool_calls) {
                                console.log(`🛠️  [${traceId}] Tool calls detected`, {
                                    toolCallsCount: delta.tool_calls.length,
                                    existingToolCalls: toolCalls.length
                                });

                                for (let i = 0; i < delta.tool_calls.length; i++) {
                                    const toolCall = delta.tool_calls[i];
                                    const index = toolCall.index ?? i;

                                    if (!toolCalls[index]) {
                                        console.log(`🆕 [${traceId}] Creating new tool call at index ${index}`, {
                                            toolCallId: toolCall.id,
                                            functionName: toolCall.function?.name
                                        });

                                        toolCalls[index] = {
                                            function: {
                                                name: '',
                                                arguments: ''
                                            },
                                            id: toolCall.id || `call_${msgIdUuid}_${index}`,
                                            index,
                                            type: toolCall.type || ''
                                        };
                                    }

                                    if (toolCall.function?.name) {
                                        toolCalls[index].function.name = toolCall.function.name;
                                    }
                                    if (toolCall.id) {
                                        toolCalls[index].id = toolCall.id;
                                    }
                                    if (toolCall.type) {
                                        toolCalls[index].type = toolCall.type;
                                    }

                                    if (toolCall.function?.arguments) {
                                        if (!accumulatedArguments[index]) {
                                            accumulatedArguments[index] = '';
                                        }
                                        accumulatedArguments[index] += toolCall.function.arguments;

                                        console.log(`📝 [${traceId}] Accumulating arguments for tool ${index}`, {
                                            currentLength: accumulatedArguments[index].length,
                                            newChunk: toolCall.function.arguments.substring(0, 50)
                                        });
                                    }
                                }

                            } else if (delta?.content) {
                                fullResponse += delta.content;

                                if (!checkAborted(signal)) {
                                    try {
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                            response: delta.content,
                                            type: "text",
                                            msg_id,
                                            created,
                                            model: { name: config.model, provider: modelConfig.provider },
                                            role: 'assistant'
                                        })}\n\n`));
                                    } catch (controllerError) {
                                        console.warn(`⚠️  [${traceId}] Controller enqueue failed:`, controllerError);
                                    }
                                }
                            }
                        } catch (error: any) {
                            console.warn(`⚠️  [${traceId}] Skipping malformed chunk`, {
                                error: error.message,
                                chunkPreview: jsonText.substring(0, 100)
                            });
                        }
                    }

                    if (checkAborted(signal)) {
                        console.log(`🛑 [${traceId}] Abort detected after line processing`);
                        break;
                    }
                }

                console.log(`📊 [${traceId}] Stream processing completed`, {
                    fullResponseLength: fullResponse.length,
                    toolCallsCount: Object.keys(accumulatedArguments).length,
                    totalChunks: chunksProcessed,
                    totalBytes: bytesProcessed,
                    tokens: estimateOutputTokens(fullResponse),
                    itokens: estimateInputTokens(history),
                    credits: calculateCredits(config.model, history, fullResponse),
                    toolTokens: estimateToolsTokens(tools)
                });

                if (fullResponse) {
                    console.log(`💾 [${traceId}] Saving assistant response`, {
                        responseLength: fullResponse.length,
                        msgId: msg_id
                    });


                }

                if (Object.keys(accumulatedArguments).length > 0) {
                    console.log(`🛠️  [${traceId}] Processing tool calls`, {
                        toolCallsCount: Object.keys(accumulatedArguments).length,
                        toolNames: toolCalls.map(tc => tc?.function?.name).filter(Boolean)
                    });

                    let msgIdUuid = uuidv7();
                    history.push({ role: 'assistant', tool_calls: toolCalls });

                    // controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    //     response: '',
                    //     role: 'assistant',
                    //     tool_calls: toolCalls,
                    //     type: "text",
                    //     msg_id: `msg_${uuidv7()}`,
                    //     created: Date.now()
                    // })}\n\n`));

                    // const chat: MessageType = {
                    //     chat_id,
                    //     role: "assistant",
                    //     content: '',
                    //     msg_id: `msg_${uuidv7()}`,
                    //     created_on: Date.now(),
                    //     tool_calls: toolCalls
                    // };

                    // if (uid) {
                    //     await storeChatData(db, redis, chat, uid, chat_id, workspace, aid);
                    //     console.log(`✅ [${traceId}] Tool calls data saved`);
                    // }

                    for (const [index, args] of Object.entries(accumulatedArguments)) {
                        const toolStartTime = performance.now();
                        console.log(`🔧 [${traceId}] Processing tool call ${index}`, {
                            functionName: toolCalls[parseInt(index)]?.function?.name,
                            argsLength: args.length
                        });

                        if (checkAborted(signal, controller, encoder)) {
                            console.log(`🛑 [${traceId}] Abort detected during tool processing`);

                            break;

                        }

                        try {
                            if (parseInt(index) > 0) {
                                msgIdUuid = uuidv7();
                            }
                            const idx = Number(index);
                            if (toolCalls[idx]) {
                                toolCalls[idx].function.arguments = accumulatedArguments[idx];
                                // history.push({ role: 'assistant', tool_calls: [toolCalls[idx]] });
                            }
                            const msg_id = `${msgIdUuid}`;
                            const functionName = toolCalls[parseInt(index)]?.function?.name;

                            if (!functionName) {
                                console.warn(`⚠️  [${traceId}] No function name for tool call ${index}`);
                                continue;
                            }
                            const config2 = {
                                model: agent.config.models.secondary.modelId,
                                mcp_server: agent.config.mcp,
                                tools: agent.config.allowedTools,
                                temperature: agent.config.models.secondary.temperature,
                                top_p: agent.config.models.secondary.topP,
                                maxToken: agent.config.models.secondary.maxTokens,
                                supportsMedia: config.supportsMedia
                            }
                            let functionResult;
                            if (functionName === "web_search") {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: 'Searching', type: "event", msg_id: `event_${uuidv7()}`, created: Date.now() })}\n\n`));
                                console.log(`🔍 [${traceId}] Processing web search`, {
                                    query: JSON.parse(args).query?.substring(0, 50)
                                });

                                // Fix: Store the result and use it properly
                                const searchResults = await Search(JSON.parse(args).query ? { query: JSON.parse(args).query } : { link: JSON.parse(args).link });
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: 'Analyzing', type: "event", msg_id: `event_${uuidv7()}`, created: Date.now() })}\n\n`));
                                // console.log(searchResults);


                                // Continue with recursive call for web search results
                                functionResult = await generateResponse(
                                    db, redis, "tool",
                                    [{ type: 'text', text: JSON.stringify(searchResults) }],
                                    memories, history, agent, config2, workspace, signal, uid, chat_id, aid, toolCalls[idx].id);

                                // Handle the recursive result...
                                // continue; // Skip the general tool execution below
                            }



                            if (checkAborted(signal, controller, encoder)) break;

                            if (controller.desiredSize === null) {
                                console.warn(`⚠️  [${traceId}] Controller is closed, skipping tool execution`);
                                return;
                            }

                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ role: 'event', response: `calling tool - ${functionName}`, type: "event", msg_id: `event_${uuidv7()}`, created: Date.now() })}\n\n`));

                            console.log(`🔍 [${traceId}] Finding clients for tool ${functionName}`, {
                                totalClients: connectionResults.length
                            });
                            if (connectionResults.length > 0) {
                                const clientsWithTool = connectionResults
                                    .filter(({ tools }) => tools.some((t: { function: { name: any; }; }) => t.function.name === functionName))
                                    .map(({ mcpClient }) => mcpClient);

                                const validClients = clientsWithTool.filter(client => client !== null);

                                console.log(`🔗 [${traceId}] Found clients for tool ${functionName}`, {
                                    validClientsCount: validClients.length
                                });

                                if (validClients.length === 0) {
                                    console.error(`❌ [${traceId}] No valid clients available for tool ${functionName}`);
                                    throw new Error("No valid clients available to call the tool.");
                                }

                                const toolCallStartTime = performance.now();
                                const result = await Promise.any(
                                    validClients.map(client =>
                                        client.callTool({
                                            name: functionName,
                                            arguments: typeof args === "string" ? JSON.parse(args) : args,
                                        }).then((result: { content: { text: string; }[]; }) => ({
                                            success: true,
                                            data: result as { content: { text: string }[] }
                                        }))
                                    )
                                );
                                const toolCallEndTime = performance.now();

                                console.log(`✅ [${traceId}] Tool call completed for ${functionName}`, {
                                    duration: `${(toolCallEndTime - toolCallStartTime).toFixed(2)}ms`,
                                    resultLength: result.data.content[0]?.text?.length || 0
                                });

                                // if (controller.desiredSize !== null) {
                                //     controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: JSON.stringify({ tool_name: functionName, result: result.data.content[0].text }), role: 'tool', type: "text", msg_id: `msg_${uuidv7()}`, created: Date.now(), model: { name: config.model, provider: modelConfig.provider }, tool_call_id: toolCalls[idx].id })}\n\n`));
                                // }

                                if (result.data.content[0].text) {
                                    // const chat: MessageType = {
                                    //     role: "tool",
                                    //     content: [{ type: 'text', text: JSON.stringify({ tool_name: functionName, result: result.data.content[0].text }) }],
                                    //     msg_id: `tool_${uuidv7()}`,
                                    //     tool_call_id: toolCalls[idx].id,
                                    //     type: 'text',
                                    //     created_on: Date.now(),
                                    //     chat_id,
                                    //     model: { name: config.model, provider: modelConfig.provider }
                                    // };
                                    if (uid) {
                                        // await storeChatData(db, redis, chat, uid, chat_id, workspace, aid);
                                        console.log(`✅ [${traceId}] Tool result saved for ${functionName}`);
                                    }
                                }

                                if (checkAborted(signal) && uid) {
                                    console.log(`🛑 [${traceId}] Abort detected before recursive call`);
                                    break;
                                }

                                console.log(`🔄 [${traceId}] Making recursive call for tool result processing`);
                                const recursiveStartTime = performance.now();


                                functionResult = await generateResponse(db, redis, "tool", [{ type: 'text', text: `${result.data.content[0].text}` }], memories, history, agent, config2, workspace, signal, uid, chat_id, aid, toolCalls[idx].id);

                                const recursiveEndTime = performance.now();
                                console.log(`🔄 [${traceId}] Recursive call completed`, {
                                    duration: `${(recursiveEndTime - recursiveStartTime).toFixed(2)}ms`,
                                    hasResult: !!functionResult
                                });
                            }

                            if (functionResult instanceof ReadableStream) {
                                console.log(`🔄 [${traceId}] Processing recursive stream result`);
                                const reader = functionResult.getReader();
                                const decoder = new TextDecoder();
                                const encoder = new TextEncoder();
                                let recursiveChunks = 0;

                                while (true) {
                                    if (checkAborted(signal) && uid) {
                                        console.log(`🛑 [${traceId}] Abort detected during recursive stream reading`);
                                        reader.cancel('Request aborted');

                                        break;
                                    }

                                    const { done, value } = await reader.read();
                                    if (done) {
                                        console.log(`✅ [${traceId}] Recursive stream completed`, {
                                            chunksProcessed: recursiveChunks
                                        });
                                        break;
                                    }

                                    recursiveChunks++;
                                    const chunk = decoder.decode(value, { stream: true }).trim();

                                    try {
                                        if (chunk.startsWith("data: ")) {
                                            const jsonString = chunk.slice(6).trim();
                                            const parsedData = JSON.parse(jsonString);
                                            fullResponse += parsedData.response;

                                            if (parsedData.response && controller.desiredSize !== null) {
                                                controller.enqueue(
                                                    encoder.encode(
                                                        `data: ${JSON.stringify(parsedData)}\n\n`
                                                    )
                                                );
                                            }
                                        }
                                    } catch (error) {
                                        console.error(`❌ [${traceId}] JSON Parsing Error in recursive stream:`, error);
                                    }

                                    if (signal?.aborted) {
                                        console.log(`🛑 [${traceId}] Signal aborted during recursive processing`);
                                        return "request aborted";
                                    }
                                }
                            }

                            const toolEndTime = performance.now();
                            console.log(`✅ [${traceId}] Tool processing completed for ${functionName}`, {
                                totalDuration: `${(toolEndTime - toolStartTime).toFixed(2)}ms`
                            });

                        } catch (error: any) {
                            console.error(`❌ [${traceId}] Error processing tool call ${index}:`, {
                                error: error.message,
                                functionName: toolCalls[parseInt(index)]?.function?.name
                            });

                            if (fullResponse && uid && !signal?.aborted) {

                            }
                            if (controller.desiredSize !== null) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: error.message, msg_id: `msg_${uuidv7()}`, type: 'error', created: Date.now() })}\n\n`));
                            }
                        }
                    }

                    closeController();
                } else {
                    closeController();
                }

                closeController();
            }
        });

        const endTime = performance.now();
        console.log(`🏁 [${traceId}] generateResponse completed successfully`, {
            totalDuration: `${(endTime - startTime).toFixed(2)}ms`,
            hasStream: !!stream
        });

        return stream;

    } catch (error: any) {
        const endTime = performance.now();
        console.error(`❌ [${traceId}] generateResponse error`, {
            error: error.message,
            errorName: error.name,
            totalDuration: `${(endTime - startTime).toFixed(2)}ms`,
            stack: error.stack
        });

        if (error.name === 'AbortError') {
            console.log(`🛑 [${traceId}] Request aborted by client`);
        } else {
            return new ReadableStream({
                start(controller) {
                    console.log(`🔄 [${traceId}] Creating error response stream`);
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: "An error occurred while generating the response.", msg_id: `msg_${uuidv7()}`, type: 'error', created: Date.now() })}\n\n`));
                    controller.close();
                },
            });
        }
    }
}
const redisKeyFor = (uid: string) => `settings:${uid}`;
export const AgentChat = async (req: Request, res: Response): Promise<void> => {
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;
    const message = req.body;
    const chatMessage = message.messageData.content;

    const abortController = (req as any).abortController;
    const signal = abortController?.signal;
    let memory: boolean = false;

    const [agentResult] = await Promise.allSettled([
        // Settings check

        getAgentByAid(db, redis, message.aid, message.uid)
    ]);


    // Track if response completed naturally
    let responseCompleted = false;




    const abortHandler = () => {
        if (!signal.aborted) {
            console.log('❌ Client disconnected, aborting processing');
            abortController.abort();
        }
    };




    try {
        let agent: any;
        if (agentResult.status === "fulfilled" && agentResult.value?.success) {
            agent = agentResult.value.agent;
        } else {
            res.status(404).json({ error: "agent not found" });
            return;
        }
        let history: any[] = [];


        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'X-Accel-Buffering': 'no'
        });

        res.flushHeaders();
        // res.write(`data: ${JSON.stringify({ msg_id: message.messageData.msg_id, response: "stream started" })}\n\n`);

        if (res.writableEnded) {
            console.warn('Cannot write response: client already disconnected');
            responseCompleted = true;
            return;
        }
        const config = {
            model: agent.config.models.primary.modelId,
            mcp_server: agent.config.mcp,
            tools: agent.config.allowedTools,
            temperature: agent.config.models.primary.temperature,
            top_p: agent.config.models.primary.topP,
            maxToken: agent.config.models.primary.maxTokens,
            supportsMedia: message.config.supportsMedia,
            instructions: agent.config.models.primary.instructions
        }
        const response = await generateResponse(db, redis, "user", chatMessage, history, agent, config, message.workspace, signal, message.uid, message.chat_id, message.aid);


        if (!response) {
            console.error('❌ generateResponse did not return a stream');
            if (!res.writableEnded) {
                res.status(500).json({ error: 'Failed to generate response stream' });
            } else {
                console.warn('❌ Cannot send error response, client already disconnected');
            }
            responseCompleted = true;
            return;
        }

        const reader = response.getReader();
        const decoder = new TextDecoder();

        const pushStream = async () => {
            try {
                while (true) {
                    if (signal?.aborted) {
                        console.log('Stream reading aborted - breaking loop');
                        reader.cancel('Request aborted by user');
                        responseCompleted = true; // Mark as completed to prevent "natural" completion
                        if (!res.writableEnded) {
                            res.end(); // End the response
                        }
                        break;
                    }

                    const { done, value } = await reader.read();

                    if (done) {
                        if (!signal?.aborted) { // Only log natural completion if not aborted
                            console.log('Stream completed naturally');
                            responseCompleted = true;
                            res.end();
                        }
                        break;
                    }

                    // Check if client disconnected before writing
                    if (res.writableEnded) {
                        console.log('Response already ended, stopping stream');
                        responseCompleted = true;
                        reader.cancel('Response ended');
                        break;
                    }

                    const jsonString = decoder.decode(value, { stream: true });
                    const cleanJsonString = jsonString.startsWith('data: ') ? jsonString.slice(6) : jsonString;

                    try {
                        const jsonData = JSON.parse(cleanJsonString);
                        res.write(jsonString);
                    } catch (jsonError: any) {
                        res.write(`Error parsing stream chunk: ${jsonError.message}`);
                    }
                }
            } catch (error) {
                console.error('Stream error:', error);
                responseCompleted = true;
                if (!res.writableEnded) {
                    res.end();
                }
            } finally {
                // Clean up the abort listener
                req.removeListener('close', abortHandler);
            }
        };

        await pushStream();

    } catch (error: any) {
        console.log(error);
        responseCompleted = true;

        // Clean up the abort listener
        req.removeListener('close', abortHandler);

        if (error.name === 'AbortError') {
            if (!res.writableEnded) {
                res.status(499).json({ error: 'Request aborted by client' });
            }
        } else {
            console.error('Error:', error);
            if (!res.writableEnded) {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
};