'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Bot,
  Settings,
  Search,
  Plus,
  MessageSquare,
  User,
  Save,
  Play,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react'
import { Oval } from 'react-loader-spinner'
import axios from 'axios'
import { useAuth } from '@/hooks/useAuth'

interface AIAgentPageProps {
  onBack: () => void
  onAskInChat: () => void
}

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

interface McpServer {
  sid: string;
  label: string;
  description: string;
  uri: string;
  type: string;
  auth: boolean;
  header?: {
    key: string;
    value: string;
  };
  tools: string[];
}

const llmModels = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" }
]

const getTools = (modelId: string) => {
  // Add logic to determine if model supports tools
  return true; // For now, assume all models support tools
}

export default function AIAgentPage({ onBack, onAskInChat }: AIAgentPageProps) {
  const { user, isAuthLoading, status } = useAuth()

  // Basic agent info
  const [agentName, setAgentName] = useState('')
  const [agentHandle, setAgentHandle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  // Model configuration
  const [primaryModel, setPrimaryModel] = useState<string>("gpt-4o-mini")
  const [secondaryModel, setSecondaryModel] = useState<string>("same-as-primary")
  const [primaryInstructions, setPrimaryInstructions] = useState('Detailed instructions for your primary model')
  const [secondaryInstructions, setSecondaryInstructions] = useState('')

  // Advanced config for primary model
  const [primaryTemperature, setPrimaryTemperature] = useState<number>(0.7)
  const [primaryTopP, setPrimaryTopP] = useState<number>(0.9)
  const [primaryMaxTokens, setPrimaryMaxTokens] = useState<number>(4000)

  // Advanced config for secondary model
  const [secondaryTemperature, setSecondaryTemperature] = useState<number>(0.7)
  const [secondaryTopP, setSecondaryTopP] = useState<number>(0.9)
  const [secondaryMaxTokens, setSecondaryMaxTokens] = useState<number>(4000)

  // Tools and demos
  const [selectedPrebuiltTools, setSelectedPrebuiltTools] = useState<string[]>([])
  const [selectedMcpTools, setSelectedMcpTools] = useState<McpServerTool[]>([])
  const [starters, setStarters] = useState<Starter[]>([])
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set())

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [mcpServers, setMcpServers] = useState<McpServer[]>([])

  useEffect(() => {
    async function getData() {
      if (status === 'unauthenticated') {
        console.error("User unauthenticated");
        return;
      }
      if (!user?.uid) {
        console.error("User UID is missing");
        return;
      }

      try {
        const serverResult = await axios.get(`${process.env.NEXT_PUBLIC_API_URI}/v1/mcp?uid=${user.uid}`, { withCredentials: true })

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
  // Mock MCP servers data

  const prebuiltTools = [
    {
      id: 'web_search',
      name: 'Web Search',
      description: 'Allows the AI to search the web and retrieve real-time information.',
      icon: Search
    }
  ]

  // Helper functions
  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  const togglePrebuiltTool = (toolName: string) => {
    setSelectedPrebuiltTools((prev) =>
      prev.includes(toolName)
        ? prev.filter((v) => v !== toolName)
        : [...prev, toolName]
    );
  }

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
  }

  const isToolSelected = (sid: string, toolName: string) => {
    const server = selectedMcpTools.find(mcp => mcp.sid === sid);
    return server ? server.allowedTools.includes(toolName) : false;
  }

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
  }

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
  }

  const getSelectedToolsForServer = (sid: string): string[] => {
    const server = selectedMcpTools.find(mcp => mcp.sid === sid);
    return server ? server.allowedTools : [];
  }

  // Demo functions
  const handleDemoChange = (id: number, value: string) => {
    setStarters((prev) =>
      prev.map((demo) =>
        demo.id === id ? { ...demo, messages: value } : demo
      )
    );
  }

  const addDemo = () => {
    const newId = Date.now();
    setStarters([...starters, { id: newId, messages: "" }]);
  }

  const removeDemo = (id: number) => {
    setStarters(starters.filter((starter) => starter.id !== id));
  }

  // Create agent function
  const createAgent = async () => {
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



    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URI}/v1/agent/create`,
        { agentData, agentMetadata, uid: user?.uid },
        {
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        console.log("Agent Created Successfully");
      } else {
        console.log(response.data.message);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (agentHandle.length >= 3 && validateUsername(agentHandle)) {
        setUsernameChecking(true);
        try {
          // Simulate API call - replace with actual endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/v1/agent/check-handle`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handle: agentHandle })
          });
          const data = await response.json();
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

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Agent Info</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onAskInChat} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Ask In Chat
            </Button>
            <Button className="gap-2" onClick={createAgent} disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Agent Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Agent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agent Name: *</label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Enter agent name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agent Handle: *</label>
                  <div className="relative">
                    <Input
                      value={agentHandle}
                      onChange={(e) => setAgentHandle(e.target.value.toLowerCase())}
                      placeholder="@agentHandle"
                      className={
                        usernameAvailable === false ? 'border-red-500' :
                          usernameAvailable === true ? 'border-green-500' : ''
                      }
                    />
                    {usernameChecking && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {!usernameChecking && usernameAvailable === true && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        ✓
                      </div>
                    )}
                    {!usernameChecking && usernameAvailable === false && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                        ✗
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description:</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your agent's purpose and capabilities"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Agent Configurations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agent Configurations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Primary Model: *</label>
                <select
                  value={primaryModel}
                  onChange={(e) => {
                    setPrimaryModel(e.target.value);
                    if (!getTools(e.target.value)) {
                      setSelectedPrebuiltTools([]);
                      setSelectedMcpTools([]);
                    }
                  }}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  {llmModels.map((llmModel) => (
                    <option key={llmModel.value} value={llmModel.value}>
                      {llmModel.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Model Instructions: *</label>
                <Textarea
                  value={primaryInstructions}
                  onChange={(e) => setPrimaryInstructions(e.target.value)}
                  placeholder="Enter detailed instructions for your primary model"
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Advanced Configuration - Primary Model:</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Temperature ({primaryTemperature}):</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={primaryTemperature}
                      onChange={(e) => setPrimaryTemperature(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Top P ({primaryTopP}):</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={primaryTopP}
                      onChange={(e) => setPrimaryTopP(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Tokens:</label>
                    <Input
                      value={primaryMaxTokens.toString()}
                      onChange={(e) => setPrimaryMaxTokens(parseInt(e.target.value) || 4000)}
                      type="number"
                      min="100"
                      max="8000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prebuilt Tools */}
          {getTools(primaryModel) && (
            <Card>
              <CardHeader>
                <CardTitle>Select Prebuilt Tools: {selectedPrebuiltTools.length}</CardTitle>
                <CardDescription>Choose tools to enhance your agent's capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prebuiltTools.map((tool) => {
                    const Icon = tool.icon
                    const isSelected = selectedPrebuiltTools.includes(tool.id)
                    return (
                      <Card
                        key={tool.id}
                        className={`cursor-pointer transition-all duration-200 ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                          }`}
                        onClick={() => togglePrebuiltTool(tool.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{tool.name}</h4>
                              <p className="text-sm text-muted-foreground">{tool.description}</p>
                            </div>
                            {isSelected && (
                              <Badge variant="default">Selected</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

              </CardContent>
            </Card>
          )}

          {/* MCP Tools */}
          {mcpServers.length > 0 && getTools(primaryModel) && (
            <Card>
              <CardHeader>
                <CardTitle>Select Your MCP Tools: {selectedMcpTools.length}</CardTitle>
                <CardDescription>Choose tools from your MCP servers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mcpServers.map((server, index) => {
                    const serverTools = Array.isArray(server.tools) ? server.tools : [];
                    const isExpanded = expandedServers.has(server.sid.toString());
                    const selectedToolsCount = getSelectedToolsForServer(server.sid.toString()).length;

                    return (
                      <div key={index} className="border rounded-lg p-4">
                        {/* Server Header */}
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleServerExpansion(server.sid.toString())}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{server.label}</h4>
                              <Badge variant="secondary">
                                {selectedToolsCount}/{serverTools.length}
                              </Badge>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                            <p className="text-sm text-muted-foreground">{server.description}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAllServerTools(server.sid.toString(), server.tools);
                            }}
                          >
                            {selectedToolsCount === serverTools.length && serverTools.length > 0 ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>

                        {/* Server Tools */}
                        {isExpanded && (
                          <div className="mt-4 space-y-2">
                            {serverTools.map((toolName, toolIndex) => (
                              <div
                                key={toolIndex}
                                className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                                onClick={() => toggleToolSelection(server.sid.toString(), toolName)}
                              >
                                <div className="flex items-center gap-2">
                                  <span>🔧</span>
                                  <span className="font-medium">{toolName}</span>
                                </div>
                                <Button
                                  variant={isToolSelected(server.sid.toString(), toolName) ? "default" : "outline"}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleToolSelection(server.sid.toString(), toolName);
                                  }}
                                >
                                  {isToolSelected(server.sid.toString(), toolName) ? 'Selected' : 'Select'}
                                </Button>
                              </div>
                            ))}
                            {serverTools.length === 0 && (
                              <div className="text-center text-muted-foreground py-4">
                                No tools available for this server
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Secondary Model */}
          {(selectedMcpTools.length > 0 || selectedPrebuiltTools.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Secondary Model Configuration</CardTitle>
                <CardDescription>Configure a secondary model for tool usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Secondary Model:</label>
                  <select
                    value={secondaryModel}
                    onChange={(e) => setSecondaryModel(e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="same-as-primary">Same as primary</option>
                    {llmModels.map((llmModel) => (
                      <option key={llmModel.value} value={llmModel.value}>
                        {llmModel.label}
                      </option>
                    ))}
                  </select>
                </div>

                {secondaryModel !== 'same-as-primary' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Secondary Model Instructions: *</label>
                      <Textarea
                        value={secondaryInstructions}
                        onChange={(e) => setSecondaryInstructions(e.target.value)}
                        placeholder="Detailed instructions for your secondary model"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Advanced Configuration - Secondary Model:</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Temperature ({secondaryTemperature}):</label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={secondaryTemperature}
                            onChange={(e) => setSecondaryTemperature(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Top P ({secondaryTopP}):</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={secondaryTopP}
                            onChange={(e) => setSecondaryTopP(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Max Tokens:</label>
                          <Input
                            value={secondaryMaxTokens.toString()}
                            onChange={(e) => setSecondaryMaxTokens(parseInt(e.target.value) || 4000)}
                            type="number"
                            min="100"
                            max="8000"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Conversation Starter */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Starter</CardTitle>
              <CardDescription>Add starter messages to help users begin conversations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {starters.map((starter, index) => (
                <div key={starter.id} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <Textarea
                      value={starter.messages}
                      onChange={(e) => handleDemoChange(starter.id, e.target.value)}
                      placeholder={`Add conversation starter ${index + 1}`}
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDemo(starter.id)}
                    className="mt-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addDemo} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Starter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
