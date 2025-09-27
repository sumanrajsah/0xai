interface Demo {
    id: number;
    input: string;
    output: string;
}

interface McpServer {
    name: string;
    uri: string,
    authKey: string;
    sid: string;
}
interface Tools {
    prebuilt: string[];
    user: string[];
}
export interface Agent {
    name: string;
    instructions: string;
    demos: Demo[];
    tools: Tools;
    isPublic: boolean;
    [key: string]: any;
}