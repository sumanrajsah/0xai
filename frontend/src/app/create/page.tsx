"use client"
import React, { useEffect, useState } from "react";
import Image from 'next/image'
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Oval } from 'react-loader-spinner'
import './style.css'

import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/context/ChatContext";
import { BrainCircuit, MessageSquare, Sparkles, ArrowRight } from "lucide-react";

export default function Create() {
    const { status, isAuthLoading } = useAuth();
    const router = useRouter();

    const createOptions = [
        {
            id: 'agent',
            title: 'AI Agents',
            description: 'Build sophisticated AI agents that automate complex workflows and decision-making processes',
            icon: <BrainCircuit />,
            route: '/create/agent',
            gradient: 'from-blue-500 to-purple-600',
            accent: '#6366f1',
            features: ['Smart Automation', 'Custom Logic', 'API Integration']
        },
        // {
        //     id: 'prompt',
        //     title: 'Prompts',
        //     description: 'Craft powerful prompt templates and conversation starters for various AI applications',
        //     icon: <MessageSquare />,
        //     route: '/store/publish/prompt',
        //     gradient: 'from-green-500 to-teal-600',
        //     accent: '#10b981',
        //     features: ['Template Library', 'Custom Variables', 'Version Control']
        // },
        {
            id: 'mcp',
            title: 'MCP Tools',
            description: 'Develop Model Context Protocol tools for seamless AI integration and enhanced capabilities',
            icon: <svg fill="currentColor" height="20px" viewBox="0 0 24 24" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z"></path><path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z"></path></svg>,
            route: '/create/mcp',
            gradient: 'from-orange-500 to-red-600',
            accent: '#f97316',
            features: ['Protocol Extensions', 'Tool Integration', 'Enhanced Context']
        }
    ];

    return (
        <div className="create-body">
            <div className="create-container">

                <div className="create-header">
                    <div className="header-badge">
                        <Sparkles className="badge-icon" />
                        <span>Create & Monetize</span>
                    </div>
                    <h1 className="create-title">
                        What would you like to
                        <span className="title-highlight"> Create?</span>
                    </h1>
                    <p className="create-subtitle">
                        Build powerful AI tools, prompts, and integrations that solve real problems.
                        Share your creations with the community and earn from your innovations.
                    </p>
                </div>

                <div className="create-grid">
                    {createOptions.map((option, index) => (
                        <div
                            key={option.id}
                            className="create-card"
                            onClick={() => router.push(option.route)}

                        >
                            <div className="card-background">
                                <div className={`card-gradient ${option.gradient}`}></div>
                                <div className="card-mesh"></div>
                            </div>

                            <div className="card-content">
                                <div className="card-header">
                                    <div className="card-icon-wrapper">
                                        <div className="card-icon">
                                            {option.icon}
                                        </div>
                                        <div className="icon-glow" ></div>
                                    </div>
                                    <div className="card-meta">
                                        <h3 className="card-title">{option.title}</h3>
                                        <div className="card-status">
                                            <span className="status-dot"></span>
                                            Ready to build
                                        </div>
                                    </div>
                                </div>

                                <p className="card-description">{option.description}</p>

                                <div className="card-action">
                                    <span className="action-text">Start Building</span>
                                    <div className="action-arrow">
                                        <ArrowRight />
                                    </div>
                                </div>
                            </div>

                            <div className="card-hover-effect"></div>
                        </div>
                    ))}
                </div>

                <div className="bottom-cta">
                    <div className="cta-content">
                        <h3>Need inspiration?</h3>
                        <p>Explore our store to see what others are building</p>
                        <button className="cta-button" onClick={() => router.push('/store')}>
                            <span>Browse Store</span>
                            <ArrowRight className="cta-arrow" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}