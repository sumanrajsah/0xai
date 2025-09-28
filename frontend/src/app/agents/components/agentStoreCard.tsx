"use client"
import React, { forwardRef, useEffect, useState } from "react";
import Image from 'next/image'
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Oval } from 'react-loader-spinner'
import './agentStyle.css'


interface AgentStoreCardProps {
    agentData: any;
    onClick?: () => void;
}

const AgentStoreCard = forwardRef<HTMLDivElement, AgentStoreCardProps>(
    ({ agentData, onClick }, ref) => {
        const {
            agent: { name, description, image, handle },
            owner: { username },
            pricing_info: { amount, currency }
        } = agentData;

        return (
            <div className="agent-store-card" ref={ref} onClick={onClick}>
                <div className="card-accent-1"></div>
                <div className="card-accent-2"></div>
                <div className="card-glow"></div>
                <div className="card-content">
                    <div className="card-header">
                        <div className="agent-image-container">
                            <img
                                src={image ? image : '/sitraone.png'}
                                alt={name}
                                className="agent-image"
                            />
                            <div className="image-ring"></div>
                        </div>
                        <div className="agent-info">
                            <div className="agent-name">{name}</div>
                            <div className="agent-handle">@{handle}</div>
                        </div>
                    </div>

                    <div className="agent-description">
                        {description}
                    </div>

                    <div className="card-footer">
                        <div className="owner-info">
                            <div className="owner-label">Created By</div>
                            <div className="owner-name">{username}</div>
                        </div>
                        <div className="card-price-container">
                            <label>price</label>
                            <div className="card-price-tag">
                                <span className="card-price-amount">{amount} </span>
                                <span className="card-price-currency"> {currency}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    });

AgentStoreCard.displayName = "AgentStoreCard";

export default AgentStoreCard;