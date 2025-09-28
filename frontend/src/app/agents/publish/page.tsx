"use client"
import React, { useEffect, useState } from "react";
import { Oval } from 'react-loader-spinner';
import './style.css';

import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { useAlert } from "@/context/alertContext";
import ToggleSwitch from "@/components/toggleSwitch";
import { useChat } from "@/context/chatContext";


const CATEGORIES = [
    'productivity',
    'creativity',
    'business',
    'education',
    'technology',
    'marketing',
    'development',
    'content creation',
    'data analysis',
    'communication'
];
export default function PublishAgent() {
    const { status, isAuthLoading, user } = useAuth();
    const { userAgents } = useChat();
    const alert = useAlert();

    const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);
    const [selectedConfigVersion, setSelectedConfigVersion] = useState<number | null>(null);
    const [price, setPrice] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagsInput, setTagsInput] = useState<string>(''); // for display

    const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const index = parseInt(e.target.value, 10);
        setSelectedAgentIndex(index);
        setSelectedConfigVersion(null); // reset config when agent changes
    };

    const handleConfigChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedConfigVersion(parseInt(e.target.value, 10));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(e.target.value);
    };

    const handlePublish = async () => {
        const selectedAgent = userAgents[selectedAgentIndex];
        const selectedConfig = selectedAgent?.configs?.find((c: { version: number | null; }) => c.version === selectedConfigVersion);

        if (!selectedConfig) {
            alert.warn("Please select a config version");
            return;
        }

        setIsPublishing(true);
        // console.log("Publishing Agent:", selectedAgent.handle);
        // console.log("Version:", selectedConfig.version, selectedConfig.config_id);
        // console.log("Price:", price);

        const data = {
            type: 'agent',
            aid: selectedAgent.aid,
            config_id: selectedConfig.config_id,
            price: price,
            uid: user?.uid,
            categories: selectedCategories,
            tags: tags
        }

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/store/publish`,
                data,
                { withCredentials: true }
            );

            const { status, data: resData } = response;
            // console.log(response)

            if (status === 200) {
                alert.success(resData.message);
                location.href = '/store/agents';
            } else {
                alert.warn('publishing failed');
            }
        } catch (error) {
            console.error('publishing error:', error);
            alert.warn('Something went wrong.');
        } finally {
            setIsPublishing(false);
        }

        setTimeout(() => {
            setIsPublishing(false);
        }, 2000);
    };
    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setTagsInput(input); // keep showing what user types

        const tagArray = input
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');

        setTags(tagArray); // store clean array
    };
    const toggleCategory = (category: string) => {
        if (!selectedCategories.includes(category) && selectedCategories.length >= 3) {
            alert.warn("You can select up to 3 categories only.");
            return;
        }

        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            } else {
                return [...prev, category];
            }
        });
    };


    const getPublishedData = async () => {
        try {
            const params = { type: 'agent' }
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/store/getpublishedData/${userAgents[selectedAgentIndex].aid}`,
                {
                    params,
                    withCredentials: true,
                }
            );
            //console.log(response)
            // when setting state after API call
            setSelectedCategories(response.data.data.info.categories ?? []);
            setTagsInput(response.data.data.info.tags ?? "");   // always string
            setTags(response.data.data.info.tags ?? "");   // always string
            setPrice(response.data.data.pricing_info.amount?.toString() ?? "");


        } catch (e) { console.log(e) }
    }
    useEffect(() => {
        if (
            userAgents &&
            userAgents.length > 0 &&
            selectedAgentIndex >= 0 &&
            selectedAgentIndex < userAgents.length &&
            userAgents[selectedAgentIndex]?.status === "published"
        ) {
            getPublishedData();
        } else {
            setSelectedCategories([])
            setTagsInput('')
            setPrice('')
        }
    }, [userAgents, selectedAgentIndex]);
    // Don't render if userAgents is empty or still loading
    if (!userAgents || userAgents.length === 0) {
        return (
            <div className="list">
                <h1 className="publish-title">Publish AUM Agents</h1>
                <div className="list-agent-cont">
                    <p>No agents available to publish.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="list">
            <h1 className="publish-title">Publish AUM Agents</h1>
            <div className="list-agent-cont">
                {/* Agent Dropdown */}
                <label>Select Your Agent</label>
                <select
                    className="agent-list-wrapper"
                    onChange={handleAgentChange}
                    value={selectedAgentIndex}
                >
                    {userAgents.map((agent, index) => (
                        <option key={agent.aid} value={index}>
                            🤖 {agent.handle}
                        </option>
                    ))}
                </select>
                {userAgents[selectedAgentIndex].status === "published" && (
                    <p style={{ width: '100%', textAlign: 'center', color: 'grey' }}>This agent is already published. Continue to republish it.</p>
                )}
                <br />


                {/* Config Version Dropdown */}
                {userAgents[selectedAgentIndex]?.configs?.length > 0 && (
                    <div className="form-group">
                        <label>Select Config Version</label>
                        <select
                            className="agent-list-wrapper"
                            onChange={handleConfigChange}
                            value={selectedConfigVersion ?? ""}
                        >
                            <option value="" disabled>Select a version</option>
                            {userAgents[selectedAgentIndex].configs.map((config: any) => (
                                <option key={config.config_id} value={config.version}>
                                    Version {config.version}
                                    {config.status === "published" ? " (Published)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="form-grid">
                    <label>Category: ({selectedCategories.length} selected)</label>
                    <div className="agent-category-checkbox-group">
                        {CATEGORIES.map((category) => (
                            <div
                                key={category}
                                className="agent-category-checkbox"
                                onClick={() => toggleCategory(category)}
                            >
                                <div className="agent-category-name">
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </div>
                                <div className="agent-category-p-check" onClick={(e) => e.stopPropagation()}>
                                    <ToggleSwitch
                                        checked={selectedCategories.includes(category)}
                                        onChange={() => toggleCategory(category)}
                                        id={`agent-category-${category}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {selectedCategories.length > 0 && (
                        <div className="agent-selected-categories">
                            Selected: {selectedCategories.join(', ')}
                        </div>
                    )}
                </div>
                <div className="form-grid">
                    <label>Tags:</label>
                    <input
                        type="text"
                        value={tagsInput}
                        onChange={handleTagsChange}
                        placeholder="ai, productivity, automation..."
                        className="agent-p-input"
                    />
                </div>

                {/* Price Input */}

                {/* Publish Button */}
                <button
                    className="publish-btn"
                    onClick={handlePublish}
                    disabled={isPublishing || selectedConfigVersion === null || price === '' || Number(price) < 10}
                >
                    {isPublishing ? (
                        <>
                            <Oval height={20} width={20} color="white" ariaLabel="publishing" secondaryColor="rgba(255,255,255,0.5)" />
                            Publishing...
                        </>
                    ) : (
                        userAgents[selectedAgentIndex].status === 'published' ? 'Republish Agent' : '🚀 Publish Agent'
                    )}
                </button>
            </div>
        </div>
    );
}