
import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';
import { ChatCompletionAssistantMessageParam, ChatCompletionContentPart, ChatCompletionMessageParam, ChatCompletionToolMessageParam } from 'openai/resources/chat/completions/completions';
import { ResponseItemList } from 'openai/resources/responses';

import { ResponseInputMessageItem, Responses } from 'openai/resources/responses/responses';
import { getAiModels } from './models';
import { v7 as uuidv7 } from 'uuid';
dotenv.config();
import axios from 'axios';
import { generateReadOnlySasUrl } from '../../../utils/upload';
import { handleDataExtraction } from '../../../utils/dataExtraction';

export function extractHashFromUrl(url: string): string | null {
    try {
        const u = new URL(url);
        // Take the last segment of pathname
        const parts = u.pathname.split("/");
        return parts[parts.length - 1] || null;
    } catch {
        return null;
    }
}
async function fileDataUrl(url: string) {
    const name = extractHashFromUrl(url);
    if (!name) {
        throw new Error("Invalid image URL: could not extract blob name.");
    }
    const fileurl = generateReadOnlySasUrl(name);
    // console.log(url)
    return fileurl
}


async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    const name = extractHashFromUrl(imageUrl);
    if (!name) {
        throw new Error("Invalid image URL: could not extract blob name.");
    }
    const url = generateReadOnlySasUrl(name);

    const response = await axios.get(url, {
        responseType: "arraybuffer"
    });

    const mimeType = response.headers["content-type"] || "application/octet-stream";
    const base64 = Buffer.from(response.data).toString("base64");

    return `data:image/png;base64,${base64}`;
}

// Azure OpenAI Configuration
const endpoint = "https://ai-rsuman78689277ai911734052583.openai.azure.com/"; // Replace with your Azure OpenAI resource endpoint
const apiKey = process.env.AZURE_OPENAI_API_KEY;

if (!apiKey) {
    throw new Error("Azure OpenAI API key is missing!");
}

const apiVersion = "2024-10-21";

const client = new AzureOpenAI({ apiKey, endpoint, apiVersion });
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
    | string; // Handle legacy string format

// Custom message type - content can be string or array
type CustomMessage = {
    role: "system" | "user" | "assistant" | "tool";
    content?: MessageContentItem[];
    name?: string;
    tool_call_id?: string;
    tool_calls?: any;
};

// Function to convert your custom format to OpenAI format
export async function convertToOpenAIFormat(
    customMessages: CustomMessage[],
    supportsMedia?: boolean
): Promise<ChatCompletionMessageParam[]> {
    const convertedMessages: ChatCompletionMessageParam[] = [];

    for (const msg of customMessages) {
        // Handle different content formats
        let convertedContent: ChatCompletionContentPart[];

        // Check if content is a string (legacy format)
        if (typeof msg.content === 'string') {
            convertedContent = [{
                type: 'text',
                text: msg.content
            }];
        }
        // Check if content is an array
        else if (Array.isArray(msg.content)) {
            convertedContent = [];

            for (const item of msg.content) {
                // Handle case where item might be a string
                if (typeof item === 'string') {
                    convertedContent.push({
                        type: 'text',
                        text: item
                    });
                    continue;
                }

                // Handle structured content items
                switch (item.type) {
                    case 'text':
                        convertedContent.push({
                            type: 'text',
                            text: item.text
                        });
                        break;

                    case 'image_url':
                        if (supportsMedia) {
                            if (item.image_url) {
                                const base64Image = await fetchImageAsBase64(item.image_url);
                                convertedContent.push({
                                    type: 'image_url',
                                    image_url: {
                                        url: base64Image
                                    }
                                });
                            }
                        } else {
                            // Convert image to text description for non-media models
                            convertedContent.push({
                                type: 'text',
                                text: `[Image content not supported by this model. Original URL: ${item.image_url || 'unknown'}]`
                            });
                        }
                        break;

                    case 'file':
                        let filedata = '';
                        if (item.file.file_url) {
                            try {
                                const url = await fileDataUrl(item.file.file_url)
                                const content = await handleDataExtraction(url);
                                filedata = content.content;
                            } catch (err) {
                                console.error('Error processing file:', err);
                            }
                        }

                        convertedContent.push({
                            type: 'text',
                            text: `[File: ${filedata}]`
                        });
                        break;

                    default:
                        // Fallback for unknown types
                        console.warn('Unknown content type:', item);
                        convertedContent.push({
                            type: 'text',
                            text: JSON.stringify(item)
                        });
                        break;
                }
            }
        }
        // Handle other formats
        else {
            console.warn('Unexpected content format:', msg.content);
            convertedContent = [{
                type: 'text',
                text: typeof msg.content === 'object' ? JSON.stringify(msg.content) : String(msg.content)
            }];
        }

        // Create the proper message structure based on role
        switch (msg.role) {
            case 'system':
                // System messages must have string content only
                const systemContent = convertedContent
                    .filter(item => item.type === 'text')
                    .map(item => item.text)
                    .join(' ');

                convertedMessages.push({
                    role: 'system',
                    content: systemContent || 'System message',
                    ...(msg.name && { name: msg.name })
                } as const);
                break;

            case 'user':
                if (supportsMedia) {
                    // User messages can have mixed content (text + images)
                    convertedMessages.push({
                        role: 'user',
                        content: convertedContent,
                        ...(msg.name && { name: msg.name })
                    } as const);
                } else {
                    // For text-only models, flatten to string content
                    const userContent = convertedContent
                        .filter(item => item.type === 'text')
                        .map(item => item.text)
                        .join(' ');

                    convertedMessages.push({
                        role: 'user',
                        content: userContent || 'Empty message',
                        ...(msg.name && { name: msg.name })
                    } as const);
                }
                break;

            case 'assistant':
                // Assistant messages should have string content
                const assistantContent = convertedContent
                    .filter(item => item.type === 'text')
                    .map(item => (item as { text: string }).text)
                    .join(' ');

                const assistantMessage: ChatCompletionAssistantMessageParam = {
                    role: 'assistant',
                    content: assistantContent || null, // Content can be null if there are tool_calls
                    ...(msg.name && { name: msg.name }),
                    ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
                };
                convertedMessages.push(assistantMessage);
                break;

            case 'tool':
                // Tool messages require a tool_call_id and string content.
                if (!msg.tool_call_id) {
                    throw new Error("Message with role 'tool' must have a 'tool_call_id'.");
                }
                const toolContent = convertedContent
                    .filter(item => item.type === 'text')
                    .map(item => (item as { text: string }).text)
                    .join(' ');

                const toolMessage: ChatCompletionToolMessageParam = {
                    role: 'tool',
                    content: toolContent,
                    tool_call_id: msg.tool_call_id,
                };
                convertedMessages.push(toolMessage);
                break;

            default:
                throw new Error(`Unknown message role: ${msg.role}`);
        }
    }

    return convertedMessages;
}
export async function convertToOpenAIResponsesFormat(customMessages: CustomMessage[]): Promise<Responses.ResponseInputItem[]> {
    const convertedMessages: Responses.ResponseInputItem[] = [];

    for (const msg of customMessages) {
        // Handle different content formats
        let convertedContent: Responses.ResponseContent[];

        // Check if content is a string (legacy format)
        if (typeof msg.content === 'string') {
            convertedContent = [{
                type: 'input_text',
                text: msg.content
            }];
        }
        // Check if content is an array
        else if (Array.isArray(msg.content)) {
            convertedContent = [];

            for (const item of msg.content) {
                // Handle case where item might be a string
                if (typeof item === 'string') {
                    convertedContent.push({
                        type: 'input_text',
                        text: item
                    });
                    continue;
                }

                // Handle structured content items
                switch (item.type) {
                    case 'text':
                        convertedContent.push({
                            type: 'input_text',
                            text: item.text
                        });
                        break;

                    case 'image_url':
                        convertedContent.push({
                            type: 'input_image',
                            image_url: item.image_url || '',
                            detail: 'auto'
                        });
                        break;

                    case 'file':
                        let filedata = '';
                        if (item.file.file_url) {
                            try {
                                const content = await handleDataExtraction(item.file.file_url);
                                filedata = content.content;
                                // console.log(content)
                            } catch (err) {
                                console.error('Error processing file:', err);
                            }
                        }
                        // If 'file' is not supported by OpenAI, fallback to text representation
                        convertedContent.push({
                            type: 'input_file',
                            file_data: `[File: ${item.file.file_data || filedata}]`
                        });
                        break;

                    default:
                        // Fallback for unknown types
                        console.warn('Unknown content type:', item);
                        convertedContent.push({
                            type: 'input_text',
                            text: JSON.stringify(item)
                        });
                        break;
                }
            }
        }
        // Handle other formats
        else {
            console.warn('Unexpected content format:', msg.content);
            convertedContent = [{
                type: 'input_text',
                text: typeof msg.content === 'object' ? JSON.stringify(msg.content) : String(msg.content)
            }];
        }

        // Create the proper message structure based on role
        switch (msg.role) {
            case 'system':
                // System messages must have string content only
                const systemContent = convertedContent
                    .filter(item => item.type === 'input_text')
                    .map(item => item.text)
                    .join(' ');

                convertedMessages.push({
                    role: 'system',
                    content: systemContent || 'System message',
                    ...(msg.name && { name: msg.name })
                } as const);
                break;

            case 'user':
                // User messages can have mixed content (text + images)
                const userContent = convertedContent
                    .filter(item => item.type === 'input_text')
                    .map(item => item.text)
                    .join(' ');
                convertedMessages.push({
                    role: 'user',
                    content: userContent || '',
                    ...(msg.name && { name: msg.name })
                } as const);
                break;

            case 'assistant':
                // Assistant messages should have string content
                const assistantContent = convertedContent
                    .filter(item => item.type === 'input_text')
                    .map(item => item.text)
                    .join(' ');

                convertedMessages.push({
                    role: 'assistant',
                    content: assistantContent || '',
                    ...(msg.name && { name: msg.name })
                } as const);
                break;

            default:
                throw new Error(`Unknown message role: ${msg.role}`);
        }
    }

    return convertedMessages;
}
export async function generateChatCompletion(
    role: "system" | "user" | "assistant" | "tool",
    tool_id: string,
    input: MessageContentItem[],
    history: Array<{ role: "system" | "user" | "assistant" | "tool"; content: MessageContentItem[] }>,
    config: any,
    signal?: AbortSignal,
) {
    // Define a more specific type for our message objects for clarity and safety.
    type MessageShape = {
        role: "system" | "user" | "assistant" | "tool";
        content?: MessageContentItem[];
        name?: string;
        tool_call_id?: string;
        tool_calls?: any;
    };

    // Assemble the initial list of messages, which might include an undefined extraMessage.
    const initialMessages: (MessageShape)[] = [
        // { role: "system", content: [{ type: 'text', text: `All response should be in ${language} language` }] },
        ...(history ?? []), // Append the conversation history (might be undefined)
        { role: role, content: input, tool_call_id: tool_id }, // Add the latest input
    ];


    try {
        // The getAiModels function is assumed to perform the final conversion
        // to the exact format required by the model's API, including handling the 'tool_call_id'.
        const modelConfig = await getAiModels(config.model, initialMessages, [], config.temperature, config.top_p, config.frequency_penalty, config.presence_penalty, true)

        const result = await fetch(modelConfig.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${modelConfig.apiKey}`
            },
            body: JSON.stringify(modelConfig.payload)
        });

        // Handle API errors by returning a stream with an error message.
        if (!result.ok) {
            const errorText = await result.text();
            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    try {
                        const errorPayload = JSON.parse(errorText);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: errorPayload.error.message, msgId: `msg_${uuidv7()}`, type: 'text', created: Date.now() })}\n\n`));
                    } catch (e) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: errorText, msgId: `msg_${uuidv7()}`, type: 'text', created: Date.now() })}\n\n`));
                    }
                    controller.close();
                }
            });
            return stream;
        }

        const reader = result.body?.getReader();
        if (!reader) throw new Error("No reader from response stream");

        // Process the successful response stream.
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done || signal?.aborted) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || ""; // Keep incomplete line for the next chunk.

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith("data:")) continue;

                        const jsonText = trimmed.replace(/^data:\s*/, "");
                        if (jsonText === "[DONE]") continue;

                        try {
                            const parsed = JSON.parse(jsonText);
                            const delta = parsed.choices[0]?.delta;
                            if (delta?.content) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                    response: delta.content,
                                    type: "text",
                                    msg_id: parsed.id,
                                    created: parsed.created,
                                    model: { name: config.model, provider: modelConfig.provider },
                                    role: 'assistant'
                                })}\n\n`));
                            }
                        } catch (error: any) {
                            console.warn("Skipping malformed/incomplete chunk:", jsonText);
                        }
                    }
                }
                controller.close();
            }
        });
        return stream;
    } catch (error) {
        console.error("Error generating response:", error);
        // Return a stream with a generic error if an exception occurs.
        return new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: "An error occurred while generating the response." })}\n\n`));
                controller.close();
            },
        });
    }
}

export async function generateResponses(userInput: MessageContentItem[], history: Array<{ role: "system" | "user" | "assistant"; content: MessageContentItem[] }>) {
    const messages: Array<{
        role: "system" | "user" | "assistant";
        content: MessageContentItem[];
        name?: string;
    }> = [
            // { role: "system", content: SystemMessage + `All response should be in ${language} language` }, // System message
            ...(history ?? []), // Append the conversation history
            { role: "user", content: userInput }, // Add the latest user input
        ];
    try {
        const result = await fetch(`${endpoint}openai/v1/responses?api-version=preview`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer `
            },
            body: JSON.stringify({
                input: await convertToOpenAIResponsesFormat(messages),
                model: 'codex-mini',
                stream: true,
            }),
        });
        if (!result.ok || !result.body) {
            throw new Error(`HTTP error! status: ${result.status}`);
        }

        const reader = result.body.getReader();
        const decoder = new TextDecoder();
        const stream = new ReadableStream({
            async start(controller) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    // Split by lines if needed
                    const lines = chunk.split("\n").filter(Boolean);
                    for (const line of lines) {
                        if (line.startsWith("data:")) {
                            try {
                                const json = JSON.parse(line.replace("data: ", ""));
                                const delta = json?.response?.output_text || json?.delta;

                                if (delta) {
                                    console.log("Streamed response:", delta);
                                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ response: delta })}\n\n`));
                                }
                            } catch (err) {
                                console.warn("Stream JSON parse error:", err);
                            }
                        }
                    }
                }

                controller.close();
            },
        });

        return stream;
    } catch (error) {
        console.error("Error generating response:", error);
        return new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: "An error occurred while generating the response." })}\n\n`));
                controller.close();
            },
        });
    }
}
export async function generateResponseNormalWithoutStream(userInput: MessageContentItem[], history?: Array<{ role: "system" | "user" | "assistant"; content: MessageContentItem[] }>, signal?: AbortSignal, language?: string) {
    const messages: Array<{
        role: "system" | "user" | "assistant";
        content: MessageContentItem[];
        name?: string;
    }> = [
            { role: "system", content: ['Act as a content creator and your task is to create a interactive caption or title'] }, // System message
            ...(history ?? []), // Append the conversation history
            { role: "user", content: userInput }, // Add the latest user input
        ];
    try {


        const result = await client.chat.completions.create({
            messages: await convertToOpenAIFormat(messages),
            model: 'gpt-4o-mini',
            stop: `${signal?.aborted}`,
            temperature: 0.8,
        });
        return result.choices[0].message.content;


    } catch (error) {
        // console.error("Error generating response:", error);
        return new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: "An error occurred while generating the response." })}\n\n`));
                controller.close();
            },
        });
    }
}
