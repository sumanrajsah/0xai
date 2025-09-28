// context/ChatContext.tsx
'use client'
import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "../hooks/useAuth";
import { v7 as uuidv7 } from 'uuid'
import { getMediaSupportByModelName } from "../../utils/models";
import { useAlert } from "./alertContext";
import { useAccount } from "wagmi";


interface ChatContextType {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setChatId: React.Dispatch<React.SetStateAction<String>>;
    selectLanguage: React.Dispatch<React.SetStateAction<string>>;
    selectModel: React.Dispatch<React.SetStateAction<string>>;
    setEditInput: React.Dispatch<React.SetStateAction<string>>;
    editInput: string;
    Model: string;
    language: string;
    chatId: String;
    aiTyping: boolean;
    aiWriting: boolean;
    setAiTyping: React.Dispatch<React.SetStateAction<boolean>>;
    setIsChatRoom: React.Dispatch<React.SetStateAction<boolean>>;
    setChatPage: React.Dispatch<React.SetStateAction<boolean>>;
    setAlertModel: React.Dispatch<React.SetStateAction<boolean>>;
    alertModel: boolean;
    abortControllerRef: React.MutableRefObject<AbortController | null>;
    handleSendMessage: (message: MessageContentItem[], mcpServers: any[], mcp_tools: any[], bot?: boolean, lang?: string) => Promise<void>;


    agentId: string;
    setAgentId: React.Dispatch<React.SetStateAction<string>>;
    setUserAgents: React.Dispatch<React.SetStateAction<any[]>>;
    userAgents: any[];

    setTools: React.Dispatch<React.SetStateAction<any[]>>;
    tools: any[];


    event: string;
    setEvent: React.Dispatch<React.SetStateAction<string>>;
}
interface MCPServerContextType {
    setMcpServers: React.Dispatch<React.SetStateAction<MCPServerInfo[]>>;
    mcpServers: MCPServerInfo[];
    setSelectedServers: React.Dispatch<React.SetStateAction<McpServer[]>>;
    selectedServers: McpServer[];
    setMcpResources: React.Dispatch<React.SetStateAction<McpResource[]>>;
    mcpResources: McpResource[];
    selectMcpResource: React.Dispatch<React.SetStateAction<McpResource | undefined>>;
    mcpResource: McpResource | undefined;
    mcpTools: string[];
    setMcpTools: React.Dispatch<React.SetStateAction<string[]>>;
}
interface AgentContextType {
    agentLoading: boolean;
}
const ChatContext = createContext<ChatContextType | undefined>(undefined);
const McpServerContext = createContext<MCPServerContextType | undefined>(undefined);
const AgentContext = createContext<AgentContextType | undefined>(undefined);


const AgentProvider = ({ children }: { children: React.ReactNode }) => {
    const { setUserAgents } = useChat();
    const { user } = useAuth();
    const alert = useAlert();
    const [agentLoading, setAgentLoading] = useState(false)

    const fetchAgentsByUID = async (uid: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/v1/agents/uid/${uid}`, {
                method: 'GET',
                credentials: 'include', // include cookies if using auth
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch agents');
            }

            return {
                success: true,
                agents: data.agents,
            };
        } catch (error: any) {
            // console.error('Error fetching agents:', error.message);
            return {
                success: false,
                error: error.message,
                agents: [],
            };
        }
    };
    useEffect(() => {
        if (!user?.uid) {
            setAgentLoading(false)
            return;
        }

        const loadAgents = async () => {
            setAgentLoading(true)
            try {

                const result = await fetchAgentsByUID(user.uid);

                if (result.success) {
                    setUserAgents(result.agents);

                } else {
                    //alert.warn('Something went wrong')
                    setUserAgents([]);
                }
            } catch (err) {
                //alert.warn('Something went wrong')
                setUserAgents([]);
            } finally {
                setAgentLoading(false)
            }
        };

        loadAgents();
    }, [user?.uid]);
    return (
        <AgentContext.Provider value={{ agentLoading }}>
            {children}
        </AgentContext.Provider>
    )
}
const McpServerProvider = ({ children }: { children: React.ReactNode }) => {
    const account = useAccount()
    const [mcpServers, setMcpServers] = useState<MCPServerInfo[]>([]);
    const [mcpResources, setMcpResources] = useState<McpResource[]>([]);
    const [mcpResource, selectMcpResource] = useState<McpResource>();
    const [selectedServers, setSelectedServers] = useState<McpServer[]>([]);
    const [mcpTools, setMcpTools] = useState<string[]>([])
    const { user, status } = useAuth();
    useEffect(() => {
        async function getData() {
            if (status === 'unauthenticated') {
                console.error("User unauthenticated");
                return;
            }
            if (!account.address) {
                console.error("User UID is missing");
                return;
            }

            try {
                const serverResult = await axios.get(`${process.env.NEXT_PUBLIC_API_URI}/v1/agents?address=${account.address}`, { withCredentials: true })

                    ;
                // //console.log(userResult, serverResult)
                // Handle workspace result

                // Handle server result independently

                const serverResponse = serverResult;
                if (serverResponse.status === 200) {
                    if (mcpServers.length !== serverResponse.data.data)
                        setMcpServers(serverResponse.data.data);
                } else {
                    // console.warn("Server data invalid or not found:", serverResponse);
                    setMcpServers([]);
                }
            } catch (err) {
                // console.error("Unexpected error occurred:", err);
            }

        }

        if (user) getData();
    }, [user, status])

    return (
        <McpServerContext.Provider
            value={{
                mcpServers,
                setMcpServers,
                selectedServers,
                setSelectedServers,
                mcpResources,
                setMcpResources,
                selectMcpResource,
                mcpResource,
                setMcpTools,
                mcpTools
            }
            }
        >
            {children}
        </McpServerContext.Provider>
    )
}

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
    const searchparams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [aiTyping, setAiTyping] = useState(false);
    const [aiWriting, setAiWriting] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const router = useRouter();
    const [chatId, setChatId] = useState<String>("")
    const [isChatRoom, setIsChatRoom] = useState<boolean>(false);
    const [historyItems, setHistory] = useState<GroupedHistoryByDate>({});
    const [language, selectLanguage] = useState<string>('English');
    const [isChatPage, setChatPage] = useState<boolean>(false);
    const [alertModel, setAlertModel] = useState<boolean>(true);
    const [tools, setTools] = useState<any[]>([])
    const [Model, selectModel] = useState<string>('gpt-5-nano');
    const [editInput, setEditInput] = useState<string>('');
    const [event, setEvent] = useState('')

    //agents 
    const [agentId, setAgentId] = useState('')
    const [userAgents, setUserAgents] = useState<any[]>([])

    ////console.log(editInput)
    const { user, status } = useAuth();
    const pathname = usePathname();
    //  //console.log(user)
    const alertMessage = useAlert()

    const chat = messages.map((msg) => ({
        role: msg.role, // "user" or "assistant"
        content: msg.content, // The message content
        tool_call_id: msg.tool_call_id,
        tool_calls: msg.tool_calls
    }));
    let memoizedHistory;
    ////console.log(messages, chat)
    useEffect(() => {
        const model = searchparams.get('model');
        if (model) {
            selectModel(model)
        }
    }, [])
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);


    const handleSendMessage = useCallback(async (message: MessageContentItem[], mcpServers: any[], mcp_tools: any[], bot?: boolean, lang?: string) => {
        abortControllerRef.current = new AbortController();


        setAiTyping(true);

        const userMessage = { content: message, msg_id: `msg_${uuidv7()}`, type: 'text', created_on: Date.now(), role: 'user' };
        setMessages((prev) => [...prev, userMessage]);


        try {

            const messageData: MessageInterface = {
                content: message,
                role: 'user',
                msg_id: `msg_${uuidv7()}`
                , type: 'text',
                created_on: 0
            }
            const config = {
                model: Model,
                mcp_server: mcpServers,
                mcp_tools: mcp_tools,
                tools: tools,
                supportsMedia: getMediaSupportByModelName(Model)
            }
            let response;
            ////console.log(chatId, chat_id)
            if (agentId !== '') {
                response = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/v1/agents/chat/completion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                    body: JSON.stringify({ messageData, history: chat, uid: `${user ? user?.uid : null}`, config: config, aid: agentId }),
                    signal: abortControllerRef.current.signal,
                    credentials: 'include',
                });
            } else {
                response = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/v1/chat/completion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                    body: JSON.stringify({ messageData, history: chat, uid: `${user ? user?.uid : null}`, config: config }),
                    signal: abortControllerRef.current.signal,
                    credentials: 'include',
                });
            }
            console.log(response)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (!response.body) {
                alertMessage.error("No response body received.");
                throw new Error("No response body received.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponse = "";


            while (true) {

                const { done, value } = await reader.read();
                if (done) {
                    return;
                }


                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n').filter(Boolean);

                for (const line of lines) {
                    try {
                        const jsonStr = line.replace(/^data:\s*/, ''); // Fix: Safe regex replace
                        const parsed = JSON.parse(jsonStr);
                        //console.log(parsed, parsed.tool_calls)

                        const msg_id = parsed.msg_id;
                        aiResponse += parsed.response;
                        //if (parsed.type === 'text') setAiTyping(false);
                        if (parsed.type !== 'event' || parsed.type !== 'error') setAiWriting(true);
                        if (parsed.type === 'error') {
                            alertMessage.error(parsed.response);
                            return;
                        }
                        if (parsed.type === 'event') {
                            // alertMessage.error(parsed.response);
                            setMessages(prevMessages => prevMessages.filter(message => message.type !== 'event'));
                            setEvent(parsed.response)

                        }

                        setMessages((prev) => {
                            return prev.some((msg) => msg.msg_id === msg_id)
                                ? prev.map((msg) =>
                                    msg.msg_id === msg_id
                                        ? { ...msg, content: msg.content + parsed.response, type: parsed.type, created_on: parsed.created, model: parsed.model, role: parsed.role, tool_calls: parsed.tool_calls, tool_call_id: parsed.tool_call_id } // Append new response
                                        : msg
                                )
                                : [...prev, { msg_id, content: parsed.response, type: parsed.type, created_on: parsed.created, role: parsed.role, model: parsed.model, tool_calls: parsed.tool_calls, tool_call_id: parsed.tool_call_id }];
                        });


                    } catch (error) {
                        alertMessage.error("Error parsing stream chunk.");
                        console.error("Error parsing stream chunk:", error, line);
                        continue;
                    }
                }
            }



        } catch (error: any) {
            console.error('Error fetching AI response:', error.message);
            if (error.name === 'AbortError') {
                alertMessage.error("Request aborted.");
                setMessages((prev) => [
                    ...prev,
                    { content: "It seems you Stop me😭😭.", isUser: false, msg_id: `msg_${Date.now()}`, type: 'error', created_on: Date.now() },
                ]);
            } else {
                alertMessage.error("Server is busy right now. Try after sometime.");
                setMessages((prev) => [
                    ...prev,
                    { content: "Server is busy right now. Try after sometime.", isUser: false, msg_id: `msg_${Date.now()}`, type: 'error', created_on: Date.now() },
                ]);
            }
        } finally {
            setAiTyping(false);
            setMessages(prevMessages => prevMessages.filter(message => message.type !== 'event'));
            setAiWriting(false)
            setEvent('')

        }
    }, [user, router, chat, chatId]);
    return (
        <ChatContext.Provider
            value={{
                messages,
                setMessages,
                aiTyping,
                setAiTyping,
                abortControllerRef,
                handleSendMessage,
                setIsChatRoom,
                setChatId,
                selectLanguage, language,
                setChatPage,
                alertModel,
                setAlertModel, selectModel,
                Model,
                chatId,
                setEditInput, editInput,
                aiWriting,
                setAgentId,
                agentId, userAgents, setUserAgents, tools, setTools, event, setEvent,
            }}
        >
            <McpServerProvider>

                <AgentProvider>
                    {children}
                </AgentProvider>
            </McpServerProvider>
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};
export const useMcpServer = () => {
    const context = useContext(McpServerContext);
    if (context === undefined) {
        throw new Error("useMcpServer");
    }
    return context;
};
export const useAgent = () => {
    const context = useContext(AgentContext);
    if (context === undefined) {
        throw new Error("error in Agent Provider");
    }
    return context;
};