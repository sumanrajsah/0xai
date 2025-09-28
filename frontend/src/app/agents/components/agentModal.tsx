'use client'
import React, { useCallback, useEffect, useState } from 'react';
import './agent-modal.css'
import { MessageCircle, X } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Oval } from 'react-loader-spinner';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/context/chatContext';
import { llmModels } from '../../../../utils/models';


interface AgentPopupModalProps {
    agent_id: string;
    onClose: () => void;
}

const AgentPopupModal: React.FC<AgentPopupModalProps> = ({ agent_id, onClose }) => {
    const { user } = useAuth();
    const router = useRouter()
    const [agentData, setAgentData] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);
    const { setEditInput } = useChat();
    const data = {
        _id: "68a0d88cfff21901c459a964",
        name: "deepwiki",
        handle: "deepwiki",
        image: "http://localhost:3002/v1/user/assets/f418b46fd9af6b440d13dcb31c06adc76065659bafefeb5feb7321691103947a",
        description: "DeepWiki automatically generates architecture diagrams, documentation, and links to source code to help you understand unfamiliar codebases quickly.",
        owner_name: "alphab",
        owner_handle: "alphab",
        tools: ["search"],
        mcp_tools: ["read_wiki_structure", "read_wiki_contents", "ask_question"],
        pricing_info: {
            amount: "100",
            currency: "AUM",
            type: "credits"
        },
        no_of_conversations: 1,
        conversation_starters: [
            {
                id: 1755381779775,
                messages: "hi"
            },
            {
                id: 1755381779776,
                messages: "Help me understand this codebase"
            },
            {
                id: 1755381779777,
                messages: "Generate architecture diagram"
            },
            {
                id: 1755381779778,
                messages: "Analyze project structure"
            }
        ],
        ratings: 4 // Added demo ratings (4 out of 5 stars)
    };
    const getAgents = async () => {
        if (loading) return;

        setLoading(true);


        try {


            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/store/agents/${agent_id}`,
                {
                    withCredentials: true,
                }
            );

            const newAgent: any = response.data.agent;
            console.log(newAgent)


            setAgentData(newAgent);



        } catch (e) {

            console.log(e)
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (agent_id)
            getAgents();
    }, []);
    const startConversation = (message: any) => {
        setEditInput(message);
        router.push(`/agent/${agent_id}`)

    };


    return (
        <div className={`agent-modal-overlay`} role="dialog"
            aria-modal="true"
            onClick={onClose}>
            {!agentData && !loading && <div className="agent-modal-container error" onClick={(e) => e.stopPropagation()}>
                <div className="header-controls">
                    <button className="close-btn" onClick={onClose}>
                        <X />
                    </button>
                </div>
                Not Found
            </div>}
            {!agentData && loading && <div className="agent-modal-container error" onClick={(e) => e.stopPropagation()}>
                <div className="header-controls">
                    <Oval height="50" width="50" color="gray" />
                </div>
                Loading...
            </div>}
            {agentData && <div className="agent-modal-container" onClick={(e) => e.stopPropagation()} >
                {/* Header */}
                <div className="agent-modal-header">
                    <div className="agent-modal-info">
                        <div className="avatar-container">
                            <img
                                src={agentData?.image}
                                alt="DeepWiki Avatar"
                                className="agent-avatar"
                            />
                            <div className="status-indicator"></div>
                        </div>
                        <div className="agent-modal-details">
                            <h2 className="agent-name">{agentData.name}</h2>
                            <p className="agent-handle">@{agentData.handle}</p>
                        </div>
                    </div>
                    <div className="header-controls">
                        <button className="close-btn" onClick={onClose}>
                            <X />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="agent-modal-content">
                    {/* Description Section */}
                    <div className="section">
                        <h3 className="section-title">About</h3>
                        <p className="description">{agentData.description}</p>
                        <div className="conversation-count">
                            <div className="chat-icon">💬</div>
                            <span className="count-number">{agentData.no_of_conversations}</span>
                            <span className="count-label">conversations</span>
                        </div>
                    </div>

                    {agentData.categories && (agentData.categories.length > 0) && <div className="section">
                        <div className="tools-grid">
                            {(agentData.categories.length > 0) && <div className="tool-category">
                                <h4 className="tool-category-title">Categories</h4>
                                <div className="tool-store-names">
                                    {agentData.categories.map((category: any, index: any) => (
                                        <span key={index} className="tool-store-name">{category}</span>
                                    ))}
                                </div>
                            </div>}
                        </div>
                    </div>}





                    {/* Tools Section */}
                    <div className="section">
                        <h3 className="section-title">Capabilities</h3>
                        <div className="tools-grid">
                            {(agentData.tools.length > 0) && <div className="tool-category">
                                <h4 className="tool-category-title">Tools</h4>
                                <div className="tool-store-names">
                                    {agentData.tools.map((tool: any, index: any) => (
                                        <span key={index} className="tool-store-name">{tool}</span>
                                    ))}
                                </div>
                            </div>}
                            {(agentData.mcp_tools.length > 0) && <div className="tool-category">
                                <h4 className="tool-category-title">MCP Tools</h4>
                                <div className="tool-store-names">
                                    {agentData.mcp_tools.map((tool: any, index: any) => (
                                        <span key={index} className="tool-store-name mcp">{tool}</span>
                                    ))}
                                </div>
                            </div>}
                            {agentData.model && <div className="tool-category">
                                <h4 className="tool-category-title">Models</h4>
                                {agentData.model.primary === agentData.model.secondary ? <div className="tool-store-names">
                                    <span className="tool-store-name model">{llmModels.map((model) => model.value === agentData.model.primary && model.label)}</span>
                                </div> : <>  <span className="tool-store-name model">{llmModels.map((model) => model.value === agentData.model.primary && model.label)}</span>  <span className="tool-store-name model">{llmModels.map((model) => model.value === agentData.model.secondary && model.label)}</span></>}
                            </div>}
                        </div>
                    </div>
                    {/* Owner Section */}
                    <div className="section">
                        <h3 className="section-title">Created by</h3>
                        <div className="owner-modal-info" >
                            <div className="owner-avatar">
                                {!agentData.avatar && <span>{agentData.owner_name[0].toUpperCase()}</span>}
                                {agentData.avatar && <img className='owner-avatar' src={agentData.avatar} alt={`${agentData.owner_name}`} />}
                            </div>
                            <div>
                                <p className="owner-name">{agentData.owner_name}</p>
                                <p className="owner-handle" >@{agentData.owner_handle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="section">
                        <h3 className="section-title">Pricing</h3>
                        <div className="pricing-card">
                            <div className="price-amount">
                                {agentData.pricing_info.amount} {agentData.pricing_info.currency}
                            </div>
                            <div className="price-type">{agentData.pricing_info.type}</div>
                        </div>
                    </div>

                    {/* Conversation Starters Section */}
                    {agentData.conversation_starters.length > 0 && <div className="section">
                        <h3 className="section-title">Quick Start</h3>
                        <div className="starters-container">
                            <div className="starters-grid">
                                {agentData.conversation_starters.map((starter: any) => (
                                    <button
                                        key={starter.id}
                                        className="starter-button"
                                        onClick={() => startConversation(starter.messages)}
                                    >
                                        <div className="starter-icon">💬</div>
                                        <div className="starter-text">{starter.messages}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>}
                    {/* Ratings Section */}
                    {/* <div className="section">
                        <h3 className="section-title">Ratings</h3>
                        <div className="ratings-chart">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                // Calculate percentage based on mock data - you can replace with real data
                                const mockData: any = { 5: 85, 4: 25, 3: 15, 2: 8, 1: 12 };
                                const percentage = mockData[rating];

                                return (
                                    <div key={rating} className="rating-bar-row">
                                        <div className="rating-star-number">
                                            <span className="star-icon">⭐</span>
                                            <span className="rating-number">{rating}</span>
                                        </div>
                                        <div className="rating-bar-container">
                                            <div
                                                className="rating-bar-fill"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div> */}
                </div>


                {/* Footer */}
                <div className="agent-modal-footer">

                    <button className="btn-primary" onClick={() => { router.push(`/agent/${agent_id}?mode=text`) }}><MessageCircle size={20} /> Start Chat</button>
                </div>
            </div>}
        </div>
    );
};

export default AgentPopupModal;