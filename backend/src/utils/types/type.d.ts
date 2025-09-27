type MessageContentItem =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: string }
    | {
        type: 'file'; file: {
            filename: string,
            file_data: string,
            file_url?: string;
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