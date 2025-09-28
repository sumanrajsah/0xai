"use client"
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import Image from 'next/image'
import './style.css'
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Oval } from 'react-loader-spinner'
import { toast, ToastContainer } from "react-toastify";
import { ChevronDown, ChevronRight, Plus, UploadCloud, User2 } from "lucide-react";

import axios from "axios";
import { useChat, useMcpServer } from "@/context/chatContext";
import { useAuth } from "@/hooks/useAuth";
import { useAlert } from "@/context/alertContext";
import { getTools, llmModels } from "../../../../utils/models";
import ToggleSwitch from "@/components/toggleSwitch";
import { useAccount } from "wagmi";

interface Starter {
    id: number;
    messages: string;
}

interface ModelConfig {
    modelId: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    instructions: string;
}

interface CreateAgent {
    config?: {
        models: {
            primary: ModelConfig,
            secondary: ModelConfig
        }
        allowedTools?: string[];
        mcp?: McpServerTool[]
        starters: Starter[];
    }
}

interface McpServerTool {
    sid: string;
    allowedTools: string[];
}




export default function CreateAgents() {
    const account = useAccount()
    const { mcpServers } = useMcpServer();
    const { user, isAuthLoading } = useAuth();
    const { userAgents, setUserAgents } = useChat();
    const router = useRouter();
    const alertMessage = useAlert();
    const modalRef = useRef<HTMLDivElement | null>(null);

    // Basic agent info
    const [agentName, setAgentName] = useState("");
    const [agentHandle, setAgentHandle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagsInput, setTagsInput] = useState<string>(''); // for display


    // Model configuration
    const [primaryModel, setPrimaryModel] = useState<string>("gpt-4o-mini");
    const [secondaryModel, setSecondaryModel] = useState<string>("same-as-primary");
    const [primaryInstructions, setPrimaryInstructions] = useState("");
    const [secondaryInstructions, setSecondaryInstructions] = useState("");

    // Advanced config for primary model
    const [primaryTemperature, setPrimaryTemperature] = useState<number>(0.7);
    const [primaryTopP, setPrimaryTopP] = useState<number>(0.9);
    const [primaryMaxTokens, setPrimaryMaxTokens] = useState<number>(4000);

    // Advanced config for secondary model
    const [secondaryTemperature, setSecondaryTemperature] = useState<number>(0.7);
    const [secondaryTopP, setSecondaryTopP] = useState<number>(0.9);
    const [secondaryMaxTokens, setSecondaryMaxTokens] = useState<number>(4000);

    // Tools and demos
    const [selectedPrebuiltTools, setSelectedPrebuiltTools] = useState<string[]>([]);
    const [selectedMcpTools, setSelectedMcpTools] = useState<McpServerTool[]>([]);
    const [starters, setStarters] = useState<Starter[]>([]);
    const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());

    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameChecking, setUsernameChecking] = useState(false);
    // UI states
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [openDisconnectModel, setOpenDisconnectModel] = useState<boolean>(false);
    const toggleCategory = (category: string) => {
        if (!selectedCategories.includes(category) && selectedCategories.length >= 3) {
            alertMessage.warn("You can select up to 3 categories only.");
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




    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setTagsInput(input); // keep showing what user types

        const tagArray = input
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');

        setTags(tagArray); // store clean array
    };

    // Validation function
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!agentName.trim()) {
            newErrors.agentName = "Agent name is required";
        } else if (agentName.length > 100) {
            newErrors.agentName = "Agent name must be less than 100 characters";
        }

        if (!agentHandle.trim()) {
            newErrors.agentHandle = "Agent handle is required";
        } else if (agentHandle.length > 100) {
            newErrors.agentHandle = "Agent handle must be less than 100 characters";
        }

        if (!primaryInstructions.trim()) {
            newErrors.primaryInstructions = "Primary model instructions are required";
        } else if (primaryInstructions.length > 5000) {
            newErrors.primaryInstructions = "Primary instructions must be less than 5000 characters";
        }

        if (secondaryModel !== "same-as-primary" && !secondaryInstructions.trim()) {
            newErrors.secondaryInstructions = "Secondary model instructions are required";
        } else if (secondaryInstructions.length > 5000) {
            newErrors.secondaryInstructions = "Secondary instructions must be less than 5000 characters";
        }

        if (!primaryModel) {
            newErrors.primaryModel = "Primary model selection is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const validateUsername = (username: string) => {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    };

    useEffect(() => {
        const checkUsernameAvailability = async () => {
            if (agentHandle.length >= 3 && validateUsername(agentHandle)) {
                setUsernameChecking(true);
                try {
                    // Simulate API call - replace with actual endpoint
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/v1/agents/check-handle`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ handle: agentHandle })
                    });
                    const data = await response.json();
                    console.log(data)
                    setUsernameAvailable(data.available);
                } catch (error) {
                    setUsernameAvailable(null);
                } finally {
                    setUsernameChecking(false);
                }
            } else {
                setUsernameAvailable(null);
            }
        };

        const timeoutId = setTimeout(checkUsernameAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [agentHandle]);

    // MCP Tools helper functions
    const toggleServerExpansion = (sid: string) => {
        setExpandedServers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sid)) {
                newSet.delete(sid);
            } else {
                newSet.add(sid);
            }
            return newSet;
        });
    };

    const isToolSelected = (sid: string, toolName: string) => {
        const server = selectedMcpTools.find(mcp => mcp.sid === sid);
        return server ? server.allowedTools.includes(toolName) : false;
    };

    const toggleToolSelection = (sid: string, toolName: string) => {
        setSelectedMcpTools(prev => {
            const existing = prev.find(mcp => mcp.sid === sid);

            if (existing) {
                const isAlreadySelected = existing.allowedTools.includes(toolName);
                const updatedTools = isAlreadySelected
                    ? existing.allowedTools.filter(t => t !== toolName)
                    : [...existing.allowedTools, toolName];

                if (updatedTools.length === 0) {
                    return prev.filter(mcp => mcp.sid !== sid);
                }

                return prev.map(mcp =>
                    mcp.sid === sid ? { ...mcp, allowedTools: updatedTools } : mcp
                );
            } else {
                return [...prev, { sid, allowedTools: [toolName] }];
            }
        });
    };

    const toggleAllServerTools = (sid: string, tools: string[]) => {
        setSelectedMcpTools(prev => {
            const existing = prev.find(mcp => mcp.sid === sid);
            const allSelected = existing && tools.every(tool => existing.allowedTools.includes(tool));

            if (allSelected) {
                return prev.filter(mcp => mcp.sid !== sid);
            } else {
                const filtered = prev.filter(mcp => mcp.sid !== sid);
                return [...filtered, { sid: sid, allowedTools: tools }];
            }
        });
    };

    const getSelectedToolsForServer = (sid: string): string[] => {
        const server = selectedMcpTools.find(mcp => mcp.sid === sid);
        return server ? server.allowedTools : [];
    };

    // Demo functions
    const handleDemoChange = (id: number, value: string) => {
        setStarters((prev) =>
            prev.map((demo) =>
                demo.id === id ? { ...demo, messages: value } : demo
            )
        );
    };

    const addDemo = () => {
        const newId = Date.now();
        setStarters([...starters, { id: newId, messages: "" }]);
    };


    const removeDemo = (id: number) => {
        setStarters(starters.filter((starter) => starter.id !== id));
    };

    // Create agent function
    async function createAgent() {
        if (!validateForm()) {
            alertMessage.warn('Please fill all required fields');
            return;
        }

        setIsLoading(true);

        // Prepare secondary model config
        const secondaryModelConfig = secondaryModel === "same-as-primary"
            ? {
                modelId: primaryModel,
                instructions: primaryInstructions,
                temperature: primaryTemperature,
                topP: primaryTopP,
                maxTokens: primaryMaxTokens
            }
            : {
                modelId: secondaryModel,
                instructions: secondaryInstructions,
                temperature: secondaryTemperature,
                topP: secondaryTopP,
                maxTokens: secondaryMaxTokens
            };

        const agentData: CreateAgent = {

            config: {
                models: {
                    primary: {
                        instructions: primaryInstructions,
                        modelId: primaryModel,
                        temperature: primaryTemperature,
                        topP: primaryTopP,
                        maxTokens: primaryMaxTokens
                    },
                    secondary: secondaryModelConfig
                },
                mcp: selectedMcpTools,
                starters: starters,
                allowedTools: selectedPrebuiltTools
            },
        };
        const agentMetadata = {
            name: agentName,
            description: description,
            handle: agentHandle,
            tags: tags,
            categories: selectedCategories
        }

        const formData = new FormData();
        formData.append('agentData', JSON.stringify(agentData));
        formData.append('agentMetadata', JSON.stringify(agentMetadata));
        formData.append('address', account.address || '');

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/agents/create`,
                {
                    agentData,
                    agentMetadata,
                    address: account.address || ""
                },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(response)
            if (response.status === 201) {
                alertMessage.success("Agent Created Successfully");
                location.href = '/store/agents/mine';
            } else {
                alertMessage.warn(response.data.message);
            }
        } catch (error) {
            console.error('Error creating agent:', error);
            alertMessage.warn('Failed to create agent. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }


    const togglePrebuiltTool = (toolName: string) => {
        setSelectedPrebuiltTools((prev) =>
            prev.includes(toolName)
                ? prev.filter((v) => v !== toolName)
                : [...prev, toolName]
        );
    };

    // Effect for modal click outside handling
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setOpenDisconnectModel(false);
            }
        }

        if (openDisconnectModel) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openDisconnectModel]);

    // if (isAuthLoading) {
    //     return (
    //         <div className="loading-container">
    //             <Oval
    //                 visible={true}
    //                 height="50"
    //                 width="50"
    //                 color="gray"
    //                 ariaLabel="oval-loading"
    //                 wrapperStyle={{}}
    //                 wrapperClass=""
    //                 secondaryColor="gray"
    //             />
    //         </div>
    //     );
    // }
    if (account.isDisconnected) {
        return <div className="mcpserver-body">
            <p>You must be logged in to create an Ai Agent.</p>
        </div>
    }
    return (
        <div className="cagent-body">
            <h1>Create AI Agent</h1>
            <div className="cagent-container">
                <h2>Agent Info</h2>
                {/* Agent Image */}

                {/* Agent Name */}
                <div className="cagent-box">
                    <label>Agent Name: *</label>
                    <input
                        type="text"
                        placeholder="Aum Agent"
                        className={`cagent-input ${errors.agentName ? 'error' : ''}`}
                        value={agentName}
                        onChange={(e) => setAgentName((e.target.value))}
                        maxLength={100}
                    />
                    {errors.agentName && <span className="error-message">{errors.agentName}</span>}
                </div>

                {/* Agent Handle */}
                <div className="cagent-box">
                    <label>Agent Handle: *</label>
                    <input
                        type="text"
                        placeholder="@aumAgent"
                        className={`cagent-input ${errors.agentHandle ? 'error' : ''}`}
                        value={agentHandle}
                        onChange={(e) => setAgentHandle((e.target.value).toLowerCase())}
                        maxLength={100}
                        style={{
                            borderColor: errors.agentHandle ? '#ff4444' :
                                usernameAvailable === false ? '#ff4444' :
                                    usernameAvailable === true ? '#44ff44' : '',
                            paddingRight: '35px'
                        }}
                    />
                    {usernameChecking && (
                        <div style={{ position: 'absolute', right: '50px' }}>
                            <Oval height="16" width="16" color="gray" />
                        </div>
                    )}
                    {!usernameChecking && usernameAvailable === true && (
                        <span style={{ position: 'absolute', right: '50px', color: '#44ff44' }}>
                            ✓
                        </span>
                    )}
                    {!usernameChecking && usernameAvailable === false && (
                        <span style={{ position: 'absolute', right: '50px', color: '#ff4444' }}>
                            ✗
                        </span>
                    )
                    }
                    {errors.agentHandle && <span className="error-message">{errors.agentHandle}</span>}
                </div >

                {/* Description */}
                < div className="cagent-box" >
                    <label>Description:</label>
                    <textarea
                        placeholder="Brief description of your agent"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={500}
                    />
                </div >
            </div >
            <div className="cagent-container">
                <h2>Agent Configurations</h2>
                {/* Primary Model */}
                <div className="cagent-box">
                    <label>Select Primary Model: *</label>
                    <select
                        className={`select-agent-model ${errors.primaryModel ? 'error' : ''}`}
                        value={primaryModel}
                        onChange={(e) => {
                            setPrimaryModel(e.target.value);
                            if (!getTools(e.target.value)) {
                                setSelectedPrebuiltTools([]);
                                setSelectedMcpTools([])
                            };
                        }}
                    >
                        {llmModels
                            .map((llmModel: { value: string; label: string }) => (
                                <option key={llmModel.value} value={llmModel.value}>
                                    {llmModel.label}
                                </option>
                            ))}
                    </select>
                    {errors.primaryModel && <span className="error-message">{errors.primaryModel}</span>}
                </div>

                {/* Primary Instructions */}
                <div className="cagent-box">
                    <label>Primary Model Instructions: *</label>
                    <textarea
                        placeholder="Detailed instructions for your primary model"
                        value={primaryInstructions}
                        onChange={(e) => setPrimaryInstructions(e.target.value)}
                        className={errors.primaryInstructions ? 'error' : ''}
                        maxLength={5000}
                    />
                    {errors.primaryInstructions && <span className="error-message">{errors.primaryInstructions}</span>}
                </div>

                {/* Primary Model Advanced Configuration */}
                <div className="cagent-box">
                    <label>Advanced Configuration - Primary Model:</label>
                    <div className="config-group">
                        <div className="config-item">
                            <label>Temperature ({primaryTemperature}):</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={primaryTemperature}
                                onChange={(e) => setPrimaryTemperature(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="config-item">
                            <label>Top P ({primaryTopP}):</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={primaryTopP}
                                onChange={(e) => setPrimaryTopP(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="config-item">
                            <label>Max Tokens:</label>
                            <input
                                type="number"
                                min="100"
                                max="8000"
                                value={primaryMaxTokens}
                                onChange={(e) => setPrimaryMaxTokens(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Prebuilt Tools */}
                {getTools(primaryModel) && <div className="cagent-box">
                    <label>Select Prebuilt Tools: {selectedPrebuiltTools.length}</label>
                    <div className="tool-checkbox-group">
                        <div className="tool-checkbox" onClick={() => togglePrebuiltTool("web_search")}>
                            <div className="tool-name">🔍 Search</div>
                            <div className="tool-des">Allows the AI to search the web and retrieve real-time information.</div>
                            <label className="tool-check" onClick={(e) => e.stopPropagation()}>
                                <ToggleSwitch
                                    checked={selectedPrebuiltTools.includes("web_search")}
                                    onChange={() => togglePrebuiltTool("web_search")}
                                    id="prebuilt-search-toggle"
                                />
                            </label>
                        </div>
                        {/* <div className="tool-checkbox" onClick={() => togglePrebuiltTool("image")}>
                            <div className="tool-name">🌄 Image</div>
                            <div className="tool-des">Allows the AI to generate and process images.</div>
                            <label className="tool-check" onClick={(e) => e.stopPropagation()}>
                                <ToggleSwitch
                                    checked={selectedPrebuiltTools.includes("image")}
                                    onChange={() => togglePrebuiltTool("image")}
                                    id="prebuilt-image-toggle"
                                />
                            </label>
                        </div> */}
                    </div>
                </div>}

                {/* MCP Tools */}
                {mcpServers.length === 0 && <div className="cgent-box">
                    <label>Add Mcp Tools</label>
                    <button onClick={() => { router.push('/create/mcp') }} className="add-demo-btn">
                        Add MCP
                    </button></div>}
                {mcpServers.length >= 1 && getTools(primaryModel) && (
                    <div className="cagent-box">
                        <label>Select Your MCP Tools: {selectedMcpTools.length}</label>
                        <div className="tool-checkbox-group">
                            {mcpServers.map((server, index) => {
                                const serverTools = Array.isArray(server.tools) ? server.tools : [];

                                const isExpanded = expandedServers.has(server?.sid?.toString());
                                const selectedToolsCount = getSelectedToolsForServer(server.sid).length;

                                return (
                                    <div key={index} className="mcp-server-container">
                                        {/* Server Header */}
                                        <div
                                            className="tool-checkbox mcp-server-header"
                                            onClick={() => toggleServerExpansion(server.sid)}
                                        >
                                            <div className="create-server-info">
                                                <div className="tool-name">
                                                    {server.label}
                                                    <span className="tool-count">({selectedToolsCount}/{serverTools.length})</span>
                                                    <span className="expand-icon">
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </span>
                                                </div>
                                                <div className="tool-des">{server.description}</div>
                                            </div>
                                            <label className="tool-check" onClick={(e) => e.stopPropagation()}>
                                                <ToggleSwitch
                                                    checked={selectedToolsCount === serverTools.length && serverTools.length > 0}
                                                    onChange={() => toggleAllServerTools(server.sid.toString(), server.tools)}
                                                />
                                            </label>
                                        </div>

                                        {/* Server Tools */}
                                        {isExpanded && (
                                            <div className="mcp-tools-container">
                                                {serverTools.map((toolName, toolIndex) => (
                                                    <div
                                                        key={toolIndex}
                                                        className="tool-checkbox mcp-tool-item"
                                                        onClick={() => toggleToolSelection(server.sid.toString(), toolName)}
                                                    >
                                                        <div className="tool-name">🔧 {toolName}</div>
                                                        <label className="tool-check" onClick={(e) => e.stopPropagation()}>
                                                            <ToggleSwitch
                                                                checked={isToolSelected(server.sid.toString(), toolName)}
                                                                onChange={() => toggleToolSelection(server.sid.toString(), toolName)}
                                                                id={`tool-${server.sid}-${toolIndex}`}
                                                            />
                                                        </label>
                                                    </div>
                                                ))}
                                                {serverTools.length === 0 && (
                                                    <div className="no-tools-message">No tools available for this server</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Secondary Model */}
                {(selectedMcpTools.length > 0 || selectedPrebuiltTools.length > 0) && <div className="cagent-box">
                    <label>Select Secondary Model:</label>
                    <select
                        className="select-agent-model"
                        value={secondaryModel}
                        onChange={(e) => setSecondaryModel(e.target.value)}
                    >
                        <option value="same-as-primary">Same as primary</option>
                        {llmModels.map((llmModel: { value: string; label: string }) => (
                            <option key={llmModel.value} value={llmModel.value}>
                                {llmModel.label}
                            </option>
                        ))}
                    </select>
                </div>}

                {/* Secondary Instructions */}
                {secondaryModel !== 'same-as-primary' && (selectedMcpTools.length > 0 || selectedPrebuiltTools.length > 0) && (
                    <>
                        <div className="cagent-box">
                            <label>Secondary Model Instructions: *</label>
                            <textarea
                                placeholder="Detailed instructions for your secondary model"
                                value={secondaryInstructions}
                                onChange={(e) => setSecondaryInstructions(e.target.value)}
                                className={errors.secondaryInstructions ? 'error' : ''}
                                maxLength={5000}
                            />
                            {errors.secondaryInstructions && <span className="error-message">{errors.secondaryInstructions}</span>}
                        </div>

                        {/* Secondary Model Advanced Configuration */}
                        <div className="cagent-box">
                            <label>Advanced Configuration - Secondary Model:</label>
                            <div className="config-group">
                                <div className="config-item">
                                    <label>Temperature ({secondaryTemperature}):</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={secondaryTemperature}
                                        onChange={(e) => setSecondaryTemperature(parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="config-item">
                                    <label>Top P ({secondaryTopP}):</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={secondaryTopP}
                                        onChange={(e) => setSecondaryTopP(parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="config-item">
                                    <label>Max Tokens:</label>
                                    <input
                                        type="number"
                                        min="100"
                                        max="8000"
                                        value={secondaryMaxTokens}
                                        onChange={(e) => setSecondaryMaxTokens(parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Demonstrations */}
                <div className="demo-container">
                    <h3>Conversation Starter</h3>
                    {starters.map((starter, index) => (
                        <div key={starter.id} className="demo-block">
                            <div className="demo-header">
                                <strong>Starter {index + 1}</strong>
                                <button onClick={() => removeDemo(starter.id)} className="remove-btn">
                                    Remove
                                </button>
                            </div>

                            <div className="demo-field">
                                <textarea
                                    value={starter.messages}
                                    onChange={(e) => handleDemoChange(starter.id, e.target.value)}
                                    placeholder="Add conversation starter"
                                />
                            </div>


                        </div>
                    ))}

                    <button onClick={addDemo} className="add-demo-btn">
                        Add Starter
                    </button>
                </div>
            </div>

            <div className="create-agent-btn-cont">
                <button
                    className="create-agent-btn"
                    onClick={createAgent}
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating...' : 'Create Agent'}
                </button>
            </div>
        </div >
    );
}