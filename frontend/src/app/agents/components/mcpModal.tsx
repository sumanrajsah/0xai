'use client'
import React, { useCallback, useEffect, useState } from 'react';
import './agent-modal.css'
import { MessageCircle, X } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';


interface AgentPopupModalProps {
    sid: string;
    onClose: () => void;
}

const McpPopupModal: React.FC<AgentPopupModalProps> = ({ sid, onClose }) => {
    const router = useRouter()
    const [data, setData] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);
    const { setEditInput } = useChat();

    const getAgents = async () => {
        if (loading) return;

        setLoading(true);


        try {


            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/store/mcps/${sid}`,
                {
                    withCredentials: true,
                }
            );

            const newMcp: any = response.data.mcp;
            // console.log(newMcp)


            setData(newMcp);



        } catch (e) {

            console.log(e)
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        getAgents();
    }, []);
    const startConversation = (message: any) => {
        setEditInput(message);
        router.push(`/agent/${sid}`)

    };


    return (
        <div className={`modal-overlay`} role="dialog"
            aria-modal="true"
            onClick={onClose}>
            {!data && <div className="modal-container error" onClick={(e) => e.stopPropagation()}>
                <div className="header-controls">
                    <button className="close-btn" onClick={onClose}>
                        <X />
                    </button>
                </div>
                Not Found
            </div>}
            {data && <div className="modal-container" onClick={(e) => e.stopPropagation()} >
                {/* Header */}
                <div className="modal-header">
                    <div className="agent-modal-info">
                        <div className="avatar-container">
                            <img
                                src={data.image ?? '/mcp.png'}
                                alt={data.label}
                                className="agent-avatar"
                            />
                            <div className="status-indicator"></div>
                        </div>
                        <div className="agent-details">
                            <h2 className="agent-name">{data.label}</h2>
                        </div>
                    </div>
                    <div className="header-controls">
                        <button className="close-btn" onClick={onClose}>
                            <X />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="modal-content">
                    {/* Description Section */}
                    <div className="section">
                        <h3 className="section-title">About</h3>
                        <p className="description">{data.description}</p>
                    </div>



                    {/* Owner Section */}
                    <div className="section">
                        <h3 className="section-title">Created by</h3>
                        <div className="owner-modal-info" onClick={() => router.push(`/store/profile/${data.owner_handle}`)}>
                            <div className="owner-avatar">
                                {!data.avatar && <span>{data.owner_name[0].toUpperCase()}</span>}
                                {data.avatar && <img className='owner-avatar' src={data.avatar} alt={`${data.owner_name}`} />}
                            </div>
                            <div>
                                <p className="owner-name">{data.owner_name}</p>
                                <p className="owner-handle">@{data.owner_handle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tools Section */}
                    {(data.tools.length > 0 || data.mcp_tools.length > 0) && <div className="section">
                        <div className="tools-grid">
                            {(data.tools.length > 0) && <div className="tool-category">
                                <h4 className="tool-category-title">Functions</h4>
                                <div className="tool-tags">
                                    {data.tools.map((tool: any, index: any) => (
                                        <span key={index} className="tool-tag">{tool}</span>
                                    ))}
                                </div>
                            </div>}
                        </div>
                    </div>}

                    {/* Pricing Section */}
                    <div className="section">
                        <h3 className="section-title">Pricing</h3>
                        <div className="pricing-card">
                            <div className="price-amount">
                                {data.pricing_info.amount} {data.pricing_info.currency}
                            </div>
                            <div className="price-type">{data.pricing_info.type}</div>
                        </div>
                    </div>

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
                <div className="modal-footer">
                    <button className="btn-secondary">Add to Quick Access</button>
                </div>
            </div>}
        </div>
    );
};

export default McpPopupModal;