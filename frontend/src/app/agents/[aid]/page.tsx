"use client"
import { use, useEffect, useRef, useState } from "react";
import axios from 'axios';
import Image from 'next/image';
import './style.css'
import '@/app/style.css';
import '@/app/globals.css'
import ChatInput from "@/app/components/chatInput";
import ChatMessage from "@/app/components/chatMessage";
import TextUserMessage from "@/app/components/chat/message-prop/user/text-user";
import ToolResultRender from "@/app/components/chat/message-prop/assistant/toolsResult";
import TextAssistantMessage from "@/app/components/chat/message-prop/assistant/text-assistant";
import { useChat, useWorkspace } from "@/context/ChatContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useAlert } from "@/context/alertContext";



export default function AgentHome({ params }: { params: Promise<{ aid: string }> }) {
    const { messages, aiTyping, setIsChatRoom, memoizedHistory, setMessages, selectLanguage, language, setChatPage, alertModel, setAlertModel, setChatId, setAgentId } = useChat();
    const abortControllerRef = useRef<AbortController | null>(null);
    const router = useRouter();
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [openDisconnecModel, setOpenDisconnectModel] = useState<boolean>(false)
    const { setCurrentWorkspace, currentWorkspace } = useWorkspace()
    const { user, status } = useAuth()
    const modalRef = useRef<HTMLDivElement | null>(null);
    const { theme } = useTheme();
    const alertMessage = useAlert()
    const [agentInfo, setAgentInfo] = useState<AgentInfo>()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setOpenDisconnectModel(false);
            }
        }

        if (openDisconnecModel) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openDisconnecModel]);

    //console.log(session)
    const { aid } = use(params);
    useEffect(() => {

        setCurrentWorkspace('')
        setChatPage(true)
        setIsChatRoom(false)
        setAgentId(aid)
        setChatId('')
        if (!user?.uid) {
            setAlertModel(false)
        }
    }, [user])

    useEffect(() => {
        async function getData() {

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/v1/agents/aid/${aid}`, {
                    method: 'GET',
                    credentials: 'include', // 👈 This is required to send cookies
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch chat');
                }

                const data = await response.json();


                console.log(data);

                //            setChatTitle(data.chat.title)
                setAgentInfo(data)


            } catch (e) { console.log(e) }
        }
        if (aid) getData()
    }, [aid])

    async function deleteChat() {
        try {
            const response = await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/chat/deleteChat`,
                {
                    data: { chat_id: selectedChat, uid: user?.uid },
                    withCredentials: true,
                }
            );
            console.log(response)

            if (response.data.status === 'success') { setSelectedChat(''); alertMessage.success('Deleted'); };
        } catch {

        }
    }
    const getStarters = (): Starter[] => {
        if (agentInfo?.configs && agentInfo.configs.length > 0) {
            const currentConfig = agentInfo.configs.find(config => config.version === agentInfo.current_version);
            return currentConfig?.config.starters || [];
        }
        return [];
    };

    const starters = getStarters();

    if (!user?.uid) {
        return <div className="chat-cont">
            <p>You must be logged in to chat with ai agents</p>
        </div>
    }


    return (
        <>
            {selectedChat && <div className="alert-cont">
                <div className="delete-alert">
                    <h2>Delete Chat</h2>
                    <hr />
                    <p>This will Delete your chat.<br />Are You sure? You want to continue.</p>
                    <div className="delete-btn" style={{ background: 'transparent' }} onClick={() => { setSelectedChat('') }}>Cancel</div>
                    <div className="delete-btn" onClick={deleteChat}>Delete</div>
                </div>
            </div>}


            <
                >
                <div
                    className="chat-cont"
                >
                    {(messages.length == 0) && <div className="agent-quote" >
                        <img src={agentInfo?.image} height={80} width={80} alt="sitraone" style={{ borderRadius: '50%' }} />
                        {agentInfo && <h2>{agentInfo.name}</h2>}
                        {agentInfo && <p>{agentInfo.description}</p>}
                        {agentInfo && agentInfo.status === 'draft' && agentInfo.uid !== user?.uid && <p>You are not able to chat it is not published or not owned by you</p>}
                        <br />

                    </div>}

                    {messages.map((msg, index) => (
                        <div className="chat-cont-message" key={msg.msg_id}>
                            {Array.isArray(msg.content) ? (
                                msg.content.map((item: MessageContentItem, idx) => {
                                    let messageContent: string;
                                    let filename: string = '';

                                    switch (item.type) {
                                        case "text":
                                            messageContent = item.text;
                                            break;
                                        case "image_url":
                                            messageContent = item.image_url;
                                            break;
                                        case "file":
                                            messageContent = `${item.file.file_url}`;
                                            filename = `${item.file.filename}`;
                                            break;
                                        default:
                                            messageContent = "Unsupported message type";
                                    }

                                    const contentKey = `${msg.msg_id}-${item.type}-${idx}`;

                                    if (msg.role === 'assistant') {
                                        return (
                                            <TextAssistantMessage
                                                key={contentKey}
                                                content={messageContent}
                                                type={item.type}
                                                role={msg.role}
                                                model={msg.model ?? { name: '', provider: '' }}
                                            />
                                        );
                                    } else if (msg.role === 'tool') {
                                        return (
                                            <ToolResultRender
                                                key={contentKey}
                                                content={messageContent}
                                            />
                                        );
                                    } else {
                                        return (
                                            <TextUserMessage
                                                key={contentKey}
                                                content={messageContent}
                                                type={item.type}
                                                role={msg.role ?? ''}
                                                filename={filename}
                                            />
                                        );
                                    }
                                })
                            ) : (
                                <>
                                    {msg.role === 'assistant' ? (
                                        <TextAssistantMessage
                                            key={msg.msg_id}
                                            content={msg.content}
                                            role={msg.role ?? ''}
                                            type={msg.type}
                                            model={msg.model ?? { name: '', provider: '' }}
                                        />
                                    ) : msg.role === 'tool' ? (
                                        <ToolResultRender
                                            key={msg.msg_id}
                                            content={msg.content}
                                        />
                                    ) : (
                                        <TextUserMessage
                                            key={msg.msg_id}
                                            content={msg.content}
                                            role={msg.role ?? ''}
                                            type={msg.type}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    ))}

                    {(aiTyping) && (
                        <ChatMessage message={''} isUser={false} type={'loading'} />


                    )}

                </div>
                {agentInfo && <>
                    {/* {starters.length > 0 && (
                        <div className="starters-container">
                            <div className="starters-grid">
                                {starters.map((starter) => (
                                    <button
                                        key={starter.id}
                                        className="starter-button"

                                    >
                                        {starter.messages}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}  */}
                    <ChatInput /></>}
            </>


        </>
    );
};
