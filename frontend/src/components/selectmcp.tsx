'use client'
import React, { useEffect, useRef, useState } from "react"
import { Image, Layers, MonitorSmartphone, PanelRightClose, Sparkles, Timer, TvMinimal, User2, ChevronDown, ChevronRight } from "lucide-react"
import './selectmcp.css'
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"

import { useAlert } from "@/context/alertContext"
import { useMcpServer } from "@/context/chatContext"
import { MCP } from "../../utils/mcp"
import ToggleSwitch from "./toggleSwitch"

interface SelectMcpButtonProps {
    openModal: boolean
    onClose: () => void
    [key: string]: any // for {...props}
}

interface McpServerWithTools {
    server: any;
    tools: string[];
    expanded: boolean;
}

const SelectMcpButton = () => {
    const searchParams = useSearchParams();
    const router = useRouter()
    const modalRef = useRef<HTMLDivElement>(null);
    const [serversWithTools, setServersWithTools] = useState<McpServerWithTools[]>([]);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [loadingServers, setLoadingServers] = useState<Set<string>>(new Set());
    const alert = useAlert();
    const [showTools, setShowTools] = useState(false)
    const [showFunctions, setShowFunctions] = useState(false)


    const { mcpServers, setMcpServers, setSelectedServers, selectedServers, setMcpResources, selectMcpResource, mcpResource, mcpResources, setMcpTools, mcpTools } = useMcpServer();
    const { theme } = useTheme()

    const toggleServerSelection = (server: any) => {
        const isCurrentlySelected = selectedServers.some((s) => s.sid === server.sid);

        if (!isCurrentlySelected) {
            // Add server to loading state
            setLoadingServers(prev => new Set([...prev, server.sid]));
        }

        setSelectedServers((prevSelected) =>
            prevSelected.some((s) => s.sid === server.sid)
                ? prevSelected.filter((s) => s.sid !== server.sid) // Remove if exists
                : [...prevSelected, server] // Add if not exists
        );
        if (isCurrentlySelected) {
            const tools = mcpServers.filter((s) => s.sid === server.sid)
            tools[0].tools.map((toolName) => setSelectedTools((prevSelected) =>
                prevSelected.includes(toolName)
                    ? prevSelected.filter((t) => t !== toolName) // Remove if exists
                    : [] // Add if not exists
            ))
        }
    };

    const toggleToolSelection = (toolName: string, server?: any) => {
        setSelectedTools((prevSelected) =>
            prevSelected.includes(toolName)
                ? prevSelected.filter((t) => t !== toolName) // Remove if exists
                : [...prevSelected, toolName] // Add if not exists
        );
        setMcpTools((prevSelected) =>
            prevSelected.includes(toolName)
                ? prevSelected.filter((t) => t !== toolName) // Remove if exists
                : [...prevSelected, toolName] // Add if not exists
        );
        setSelectedServers((prevSelected) =>
            prevSelected.some((s) => s.sid === server.sid)
                ? prevSelected
                : [...prevSelected, server]
        );

    };
    const toggleAllTools = (server: any) => {
        if (!server.tools && selectedServers.some((s) => s.sid === server.sid)) return;

        setSelectedTools((prev) => {
            const allSelected = server.tools.every((t: any) =>
                prev.some((p: any) => p.name === t.name)
            );

            return allSelected
                ? prev.filter((p: any) => !server.tools.some((t: any) => t.name === p.name))
                : [...prev, ...server.tools.filter((t: any) => !prev.some((p: any) => p.name === t.name))];
        });

        setMcpTools((prev) => {
            const allSelected = server.tools.every((t: any) =>
                prev.some((p: any) => p.name === t.name)
            );

            return allSelected
                ? prev.filter((p: any) => !server.tools.some((t: any) => t.name === p.name))
                : [...prev, ...server.tools.filter((t: any) => !prev.some((p: any) => p.name === t.name))];
        });
    };


    useEffect(() => {
        const fetchToolsForServers = async () => {
            if (!selectedServers || selectedServers.length === 0) {
                setServersWithTools([]);
                setLoadingServers(new Set());
                return;
            }

            try {
                const serverToolsPromises = selectedServers.map(async (server: any) => {
                    // Check if server already exists in serversWithTools
                    if (serversWithTools.some((s) => s.server.sid === server.sid)) {
                        return null; // Skip this server
                    }

                    // Add server to loading state
                    setLoadingServers(prev => new Set(prev).add(server.sid));

                    try {
                        const endpoint = {
                            auth: server.auth,
                            uri: server.config.url,
                            header: {
                                key: server.config.header.key,
                                value: server.config.header.value
                            }
                        };

                        const result = await MCP(endpoint);

                        if (result.error !== null) {
                            throw new Error(result.error);
                        }

                        const tools = result.tools
                            ?.filter((tool: any) => server.tools.includes(tool.function.name))
                            ?.map((tool: any) => tool) || [];


                        const resources = result.resources || [];

                        // const selecttools = mcpServers.filter((s) => s.sid === server.sid);
                        // if (selecttools.length > 0) {
                        //     setSelectedTools((prevSelected) => {
                        //         const newTools = selecttools[0].tools.filter(
                        //             (toolName) => !prevSelected.includes(toolName)
                        //         );
                        //         return [...prevSelected, ...newTools];
                        //     });
                        // }
                        // Update global resources
                        const mappedResources = resources.map((r: any) => ({
                            uri: r.uri,
                            name: r.name,
                            ...r
                        }));

                        setMcpResources(prev => {
                            // Avoid duplicates based on URI
                            const existingUris = new Set(prev.map(resource => resource.uri));
                            const newResources = mappedResources.filter((resource: { uri: string }) => !existingUris.has(resource.uri));
                            return [...prev, ...newResources];
                        });

                        // Remove server from loading state
                        setLoadingServers(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(server.sid);
                            return newSet;
                        });

                        return {
                            server,
                            tools: tools.map(tool => tool.function.name),
                            expanded: false
                        };
                    } catch (error) {
                        console.error(`Error fetching tools for server ${server.label}:`, error);
                        alert.error(`Error fetching tools for ${server.label}: ${error}`);

                        // Remove server from loading state even on error
                        setLoadingServers(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(server.sid);
                            return newSet;
                        });

                        return {
                            server,
                            tools: [],
                            expanded: false
                        };
                    }
                });

                const serverToolsData = (await Promise.all(serverToolsPromises)).filter(Boolean) as McpServerWithTools[];

                // Update serversWithTools by merging with existing data
                setServersWithTools(prev => {
                    const existingServerIds = new Set(prev.map(swt => swt.server.sid));
                    const newServersWithTools = serverToolsData.filter(swt => !existingServerIds.has(swt.server.sid));
                    return [...prev, ...newServersWithTools];
                });

            } catch (error) {
                console.error('Error in fetchToolsForServers:', error);
                alert.error(`Something went wrong: ${error}`);
                // Clear loading state on general error
                setLoadingServers(new Set());
            }
        };

        fetchToolsForServers();
        setSelectedTools(mcpTools)
    }, [selectedServers]); // Consider adding other dependencies if needed

    //if (!openModal) return null;

    return (
        <div className="selectmcp-btn-modal">
            <label>Select MCP Servers & Tools</label>
            <div className="selectmcp-btn-cont">
                {mcpServers.map((server, index) => {
                    const isSelected = selectedServers.some((s) => s.sid === server.sid);
                    const serverWithTools = serversWithTools.find(swt => swt.server.sid === server.sid);

                    return (
                        <div key={index + server.created_on} className="mcp-server-group">
                            {/* Server Selection */}
                            {!showTools && <div className="mcp-checkbox server-checkbox">
                                <div className="mcp-content">
                                    <div className="mcp-name">{server.label}</div>
                                    {server.tools.length > 0 && (
                                        <div className="mcp-tools-count">
                                            {server.tools.length} tools
                                        </div>
                                    )}
                                </div>
                                <div className="mcp-controls">
                                    {loadingServers.has(`${server.sid}`) ? (
                                        <div className="mcp-loader">
                                            <div className="spinner" />
                                        </div>
                                    ) : (
                                        <div className="mcp-check">
                                            <ToggleSwitch
                                                checked={isSelected}
                                                onChange={() => { toggleServerSelection(server); toggleAllTools(server) }}
                                                id={`toggle-${server.sid}`}
                                            />
                                        </div>
                                    )}

                                    <button
                                        className="expand-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowFunctions(!showFunctions)
                                        }}
                                    >
                                        {showFunctions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>

                                </div>
                            </div>}

                            {/* Tools Dropdown */}
                            {showFunctions && !showTools && (
                                <div className="tools-dropdown">
                                    {server.tools.map((toolName, toolIndex) => (
                                        <div
                                            key={toolIndex + toolName}
                                            className="mcp-checkbox mcptool-checkbox"
                                            onClick={() => toggleToolSelection(toolName, server)}
                                        >
                                            <div className="mcptool-name">{toolName}</div>
                                            <div className="mcp-check">
                                                <ToggleSwitch
                                                    checked={selectedTools.includes(toolName)}
                                                    onChange={(e) => { e.stopPropagation(); toggleToolSelection(toolName, server) }}
                                                    id={`toggle-tool-${toolName}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {selectedTools.length > 0 && <button className="add-mcp-btn" onClick={() => setShowTools(!showTools)}>{showTools ? 'Hide Mcp Functions' : 'Show Mcp Functions'}</button>}
            <button className="add-mcp-btn" onClick={() => router.push('/create/mcp')}>+ Add Mcp</button>

            {/* Selected Tools Summary */}
            {showTools && selectedTools.length > 0 && (
                <div className="selected-tools-summary">
                    <div className="summary-label">Selected Tools ({selectedTools.length})</div>
                    <div className="selected-tools-list">
                        {selectedTools.map((toolName, index) => (
                            <div key={index} className="tool-tag">
                                <span> {toolName}</span>
                                <button
                                    className="remove-tool-btn"
                                    onClick={() => toggleToolSelection(toolName)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectMcpButton;