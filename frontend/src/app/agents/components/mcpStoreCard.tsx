"use client"
import React, { forwardRef, useEffect, useState } from "react";
import Image from 'next/image'
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Oval } from 'react-loader-spinner'
import './mcpStorecardStyle.css'

interface McpCardProps {
    mcpData: any;
    onClick?: () => void;
}

const McpCard = forwardRef<HTMLDivElement, McpCardProps>(
    ({ mcpData, onClick }, ref) => {
        const {
            mcp: { label, description, sid, tools, image },
            owner: { username },
            pricing_info: { amount, currency }
        } = mcpData;

        // Generate a handle from the label or use sid as fallback
        const generateHandle = (label: string, sid: string) => {
            if (label) {
                return label.toLowerCase().replace(/\s+/g, '');
            }
            // Extract a readable part from sid if possible
            return sid.split('_')[1]?.substring(0, 8) || 'agent';
        };

        const handle = generateHandle(label, sid);

        return (
            <div className="mcp-card" ref={ref} onClick={onClick}>
                <div className="card-accent-1"></div>
                <div className="card-accent-2"></div>
                <div className="card-glow"></div>
                <div className="card-content">
                    <div className="card-header">
                        <div className="mcp-image-container">
                            <img
                                src={image ? image : '/mcp.png'}// Default image since no image field in JSON
                                alt={label}
                                className="mcp-image"
                            />
                            <div className="image-ring"></div>
                        </div>
                        <div className="mcp-info">
                            <div className="mcp-name">{label}</div>
                        </div>
                    </div>

                    <div className="mcp-description">
                        {description}
                    </div>
                    {tools && tools.length > 0 && (
                        <div className="mcp-tools">
                            <div className="tools-label">Available Tools</div>
                            <div className="tools-list">
                                {tools.slice(0, 2).map((tool: any, index: any) => (
                                    <span key={index} className="tool-tag">
                                        {tool}
                                    </span>
                                ))}
                                {tools.length > 2 && (
                                    <span className="tool-tag more-tools">
                                        +{tools.length - 2} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

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

McpCard.displayName = "McpCard";

export default McpCard;