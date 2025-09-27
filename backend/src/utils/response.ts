
import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';
import { ChatCompletionAssistantMessageParam, ChatCompletionContentPart, ChatCompletionMessageParam, ChatCompletionToolMessageParam } from 'openai/resources/chat/completions/completions';
import { v7 as uuidv7 } from 'uuid';
dotenv.config();
import axios from 'axios';
import { handleDataExtraction, extractFileData } from './dataExtraction';
import fs from 'fs';
import path from 'path';

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

/**
 * Converts base64 data URL to a temporary file path for processing
 * @param dataUrl Base64 data URL (e.g., "data:application/pdf;base64,JVBERi0xLjQ...")
 * @returns Promise<string> Path to temporary file
 */
async function fileDataUrl(dataUrl: string): Promise<string> {
    try {
        // Parse data URL
        const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid data URL format');
        }

        const [, mimeType, base64Data] = matches;

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Create temporary file
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate unique filename with appropriate extension
        const extension = getExtensionFromMimeType(mimeType);
        const tempFileName = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`;
        const tempFilePath = path.join(tempDir, tempFileName);

        // Write buffer to temporary file
        fs.writeFileSync(tempFilePath, buffer);

        return tempFilePath;
    } catch (error) {
        throw new Error(`Failed to process data URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get file extension from MIME type
 * @param mimeType MIME type string
 * @returns File extension with dot
 */
function getExtensionFromMimeType(mimeType: string): string {
    const mimeToExtension: Record<string, string> = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.ms-excel': '.xls',
        'text/csv': '.csv',
        'text/plain': '.txt',
        'text/markdown': '.md',
        'text/html': '.html',
        'application/json': '.json',
        'text/javascript': '.js',
        'text/typescript': '.ts',
        'application/xml': '.xml',
        'text/xml': '.xml',
        'application/rtf': '.rtf',
        'application/vnd.oasis.opendocument.text': '.odt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
        'application/vnd.ms-powerpoint': '.ppt'
    };

    return mimeToExtension[mimeType] || '.txt';
}

/**
 * Process base64 file data directly
 * @param fileData Base64 encoded file data
 * @param filename Original filename
 * @returns Promise<string> Extracted text content
 */
async function processBase64File(fileData: string, filename: string): Promise<string> {
    try {
        // If it's a data URL, extract the base64 part
        let base64Data = fileData;
        let mimeType = '';

        if (fileData.startsWith('data:')) {
            const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                [, mimeType, base64Data] = matches;
            }
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Create temporary file
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Use original filename or generate one with extension
        const extension = path.extname(filename) || getExtensionFromMimeType(mimeType);
        const tempFileName = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`;
        const tempFilePath = path.join(tempDir, tempFileName);

        // Write buffer to temporary file
        fs.writeFileSync(tempFilePath, buffer);

        try {
            // Extract content using existing function
            const result = await extractFileData(tempFilePath, extension);
            return result.content;
        } finally {
            // Clean up temporary file
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupError) {
                console.warn(`Failed to cleanup temporary file ${tempFilePath}:`, cleanupError);
            }
        }
    } catch (error) {
        throw new Error(`Failed to process base64 file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

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
                                convertedContent.push({
                                    type: 'image_url',
                                    image_url: {
                                        url: item.image_url
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

                        // Handle base64 file data (primary method)
                        if (item.file.file_data) {
                            try {
                                filedata = await processBase64File(item.file.file_data, item.file.filename);
                            } catch (err) {
                                console.error('Error processing base64 file:', err);
                                filedata = `[Error processing file: ${err instanceof Error ? err.message : 'Unknown error'}]`;
                            }
                        }
                        // Fallback: Handle file URL (if provided)
                        else if (item.file.file_url) {
                            try {
                                const content = await handleDataExtraction(item.file.file_url);
                                filedata = content.content;
                            } catch (err) {
                                console.error('Error processing file URL:', err);
                                filedata = `[Error processing file: ${err instanceof Error ? err.message : 'Unknown error'}]`;
                            }
                        }
                        // No file data available
                        else {
                            filedata = `[File: ${item.file.filename} - No content available]`;
                        }

                        convertedContent.push({
                            type: 'text',
                            text: `[File: ${item.file.filename}]\n${filedata}`
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