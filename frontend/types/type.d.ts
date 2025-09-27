interface ChatHistory {
    chat_id: string;
    title: string;
    uid: string;
    created_on: number;
    updated_on: number;
    wid?: string;
    aid?: string
}
type GroupedHistoryByDate = Record<string, ChatHistory[]>;

type ChatMode = 'text' | 'image' | 'video';

type MessageContentItem =
    | { type: 'text'; 'text': string }
    | { type: 'image_url'; 'image_url': string }
    | {
        type: 'file'; 'file': {
            'filename': string,
            'file_data'?: string,
            'file_url'?: string
        }
    }
// You can add more types as needed
// | { type: "video_url"; video_url: string }

type MessageContent = string | MessageContentItem[];

interface Message {
    msg_id: string;
    content: MessageContent;
    type: string; // "text", "image", etc.
    role?: string;
    created_on: any;
    model?: {
        name: string;
        provider: string;
    }
    tool_call_id?: string;
    tool_calls?: any[]
}

interface MessageInterface {
    msg_id: string;
    content: MessageContent;
    role: string; // "user" | "assistant"
    type: string;
    role?: string;
    created_on: any;
    model?: {
        name: string;
        provider: string;
    }
    tool_call_id?: string;
    tool_calls?: any[]
}

interface McpServer {
    label: string;
    description: string;
    uri: string,
    authKey: string;
    sid: string;
}

interface MCPServerInfo {
    label: String,
    description: string,
    sid: String,
    uid: string,
    serverType: string,
    created_on: number,
    updated_on: number,
    auth: boolean,
    config: Config,
    tools: string[],
    status: string,
}
interface Config {
    url: String,
    header: Header,
    type: String,

}
interface Header {
    key: string;
    value: string
}
interface McpResource {
    uri: string;
    name: string;
}
type Workspace = {
    name: string;
    wid: string;
}

type ImageSettings = {
    size?: string;
    ratio?: string;
    style?: string;
    quality?: string;
}
type ImageMetadata = {
    image_id: string;
    created: number;
    image_url: string;
    model: {
        name: string;
        provider: string;
    }
    config: ImageSettings;
    uid: string;
    wid?: string;
    revised_prompt: string;
    prompt: string;
}
type VideoSettings = {
    resolution?: string;
    ratio?: string;
    duration?: string;
}
type VideoMetadata = {
    video_id: string;
    created: number;
    video_url: string;
    model: {
        name: string;
        provider: string;
    }
    config: VideoSettings;
    uid: string;
    wid?: string;
    revised_prompt: string;
    prompt: string;
}
interface Starter {
    id: number;
    messages: string;
}
type AgentInfo = {
    name: string;
    description: string;
    handle: string;
    image: string;
    config?: {
        models: {
            primary: ModelConfig,
            secondary: ModelConfig
        }
        allowedTools?: string[];
        mcp?: McpServerTool[]
        starters: Starter[];
    }
    current_version?: any;
    configs?: any[]
    uid: string;
    aid: string;
    status: string;
}