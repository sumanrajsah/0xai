"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Wrench,
  Plus,
  Bot,
  Users,
  Settings,
  Zap,
  Globe,
  Database,
  FileText,
  Search,
  Play,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface MCPToolsPageProps {
  onBack: () => void;
  onAddMCP: () => void;
  onMyAgents?: () => void;
}

interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: 'DeFi' | 'Web3' | 'Trading' | 'Analytics' | 'General';
  status: 'active' | 'inactive' | 'training';
  tools: string[];
  lastUsed: string;
  avatar?: string;
}

interface MCPServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  type: 'Streamable HTTP' | 'WebSocket' | 'SSE';
  uri: string;
  tools: string[];
  lastConnected: string;
}

export default function MCPToolsPage({ onBack, onAddMCP, onMyAgents }: MCPToolsPageProps) {
  const [activeTab, setActiveTab] = useState<'agents' | 'servers' | 'my-agents'>('agents');
  
  const [aiAgents] = useState<AIAgent[]>([
    {
      id: "1",
      name: "DeFi Analyzer",
      description: "Advanced DeFi protocol analysis and yield optimization",
      type: "DeFi",
      status: "active",
      tools: ["Web Search", "Price Analysis", "Risk Assessment"],
      lastUsed: "2 hours ago",
      avatar: "🤖"
    },
    {
      id: "2", 
      name: "Web3 Explorer",
      description: "Blockchain exploration and smart contract analysis",
      type: "Web3",
      status: "active",
      tools: ["Blockchain Query", "Contract Analysis", "Transaction History"],
      lastUsed: "1 day ago",
      avatar: "🔍"
    },
    {
      id: "3",
      name: "Trading Bot",
      description: "Automated trading strategies and market analysis",
      type: "Trading", 
      status: "training",
      tools: ["Market Data", "Technical Analysis", "Order Management"],
      lastUsed: "3 days ago",
      avatar: "📈"
    },
    {
      id: "4",
      name: "Analytics Pro",
      description: "Comprehensive blockchain analytics and reporting",
      type: "Analytics",
      status: "inactive",
      tools: ["Data Visualization", "Custom Reports", "API Integration"],
      lastUsed: "1 week ago",
      avatar: "📊"
    }
  ]);

  const [mcpServers] = useState<MCPServer[]>([
    {
      id: "1",
      name: "SitrAi",
      description: "AI-powered search and analysis tools",
      status: "connected",
      type: "Streamable HTTP",
      uri: "https://mcp.sitrai.com/mcp",
      tools: ["web_search", "content_analysis", "sentiment_analysis"],
      lastConnected: "2 hours ago"
    },
    {
      id: "2",
      name: "WebSearch",
      description: "Real-time web search capabilities",
      status: "disconnected",
      type: "WebSocket",
      uri: "wss://mcp.websearch.com/ws",
      tools: ["search", "news_search", "image_search"],
      lastConnected: "1 day ago"
    },
    {
      id: "3",
      name: "Database Connector",
      description: "Database operations and queries",
      status: "connected",
      type: "Streamable HTTP",
      uri: "https://db.mcp.example.com",
      tools: ["query", "insert", "update", "delete"],
      lastConnected: "30 minutes ago"
    }
  ]);

  // Mock user's AI agents data
  const [userAgents] = useState<AIAgent[]>([
    {
      id: "user-1",
      name: "My DeFi Trader",
      description: "Personal DeFi trading assistant with custom strategies",
      type: "Trading",
      status: "active",
      tools: ["Price Analysis", "Risk Assessment", "Portfolio Tracking"],
      lastUsed: "1 hour ago",
      avatar: "🚀"
    },
    {
      id: "user-2",
      name: "Web3 Researcher",
      description: "Custom research agent for blockchain projects",
      type: "Web3",
      status: "active",
      tools: ["Project Analysis", "Token Research", "Market Trends"],
      lastUsed: "3 hours ago",
      avatar: "🔬"
    },
    {
      id: "user-3",
      name: "Yield Optimizer",
      description: "Automated yield farming optimization",
      type: "DeFi",
      status: "training",
      tools: ["Yield Calculation", "APR Analysis", "Risk Management"],
      lastUsed: "2 days ago",
      avatar: "⚡"
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'training':
      case 'error':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'training':
      case 'error':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DeFi':
        return <Zap className="h-4 w-4" />;
      case 'Web3':
        return <Globe className="h-4 w-4" />;
      case 'Trading':
        return <Search className="h-4 w-4" />;
      case 'Analytics':
        return <Database className="h-4 w-4" />;
      case 'General':
        return <Bot className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-card to-card/95 backdrop-blur-sm border-b px-6 py-6 flex-shrink-0">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2 hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  MCP Tools
                </h1>
                <p className="text-sm text-muted-foreground">Manage your AI agents and MCP servers</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setActiveTab('my-agents')} 
              className="gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
            >
              <Users className="h-4 w-4" />
              My Agents
            </Button>
            <Button onClick={onAddMCP} className="gap-2">
              <Plus className="h-4 w-4" />
              Add MCP
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex space-x-1 bg-muted/30 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'agents' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('agents')}
            className="gap-2 transition-all duration-200"
          >
            <Bot className="h-4 w-4" />
            AI Agent Types
          </Button>
          <Button
            variant={activeTab === 'servers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('servers')}
            className="gap-2 transition-all duration-200"
          >
            <Settings className="h-4 w-4" />
            MCP Servers
          </Button>
          <Button
            variant={activeTab === 'my-agents' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('my-agents')}
            className="gap-2 transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            My Agents
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Model Context Protocol Tools
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Develop and manage MCP tools for seamless AI integration and
              enhanced capabilities. Connect to various services and extend your
              AI agent's functionality.
            </p>
          </div>

          {/* AI Agent Types Section */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">AI Agent Types</h3>
                  <p className="text-muted-foreground">Choose from our pre-built AI agent templates</p>
                </div>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {aiAgents.map((agent) => (
                <Card 
                  key={agent.id} 
                  className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 hover:border-primary/30 bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-sm hover:scale-[1.02] hover:-translate-y-1"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex items-center justify-center text-2xl shadow-lg">
                            {agent.avatar}
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500 border-2 border-background"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                            {agent.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="p-1 rounded-md bg-muted/50">
                              {getTypeIcon(agent.type)}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className="text-xs capitalize font-medium px-2 py-1"
                            >
                              {agent.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusIcon(agent.status)}
                        <Badge 
                          className={`text-xs font-medium px-2 py-1 ${getStatusColor(agent.status)}`}
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {agent.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available Tools</div>
                      <div className="flex flex-wrap gap-2">
                        {agent.tools.slice(0, 3).map((tool, index) => (
                          <Badge key={index} variant="outline" className="text-xs font-medium px-2 py-1 bg-muted/30 hover:bg-muted/50 transition-colors">
                            {tool}
                          </Badge>
                        ))}
                        {agent.tools.length > 3 && (
                          <Badge variant="outline" className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary border-primary/20">
                            +{agent.tools.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Last used {agent.lastUsed}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/10 hover:border-primary/30"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                        <Button 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </div>
          )}

          {/* My Agents Section */}
          {activeTab === 'my-agents' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">My AI Agents</h3>
                  <p className="text-muted-foreground">Your personalized AI agents and their configurations</p>
                </div>
                <Button onClick={onAddMCP} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Agent
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {userAgents.map((agent) => (
                  <Card 
                    key={agent.id} 
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 bg-gradient-to-br from-card to-card/50"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-2xl">
                            {agent.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-bold truncate">{agent.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {getTypeIcon(agent.type)}
                              <Badge 
                                variant="secondary" 
                                className="text-xs capitalize"
                              >
                                {agent.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(agent.status)}
                          <Badge 
                            className={`text-xs ${getStatusColor(agent.status)}`}
                          >
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {agent.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Available Tools:</div>
                        <div className="flex flex-wrap gap-1">
                          {agent.tools.slice(0, 3).map((tool, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                          {agent.tools.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.tools.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Last used {agent.lastUsed}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* MCP Servers Section */}
          {activeTab === 'servers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">MCP Servers</h3>
                  <p className="text-muted-foreground">Manage your connected MCP servers</p>
                </div>
                <Button onClick={onAddMCP} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add MCP Server
                </Button>
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {mcpServers.map((server) => (
                <Card 
                  key={server.id} 
                  className="group hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold truncate">{server.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {server.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {getStatusIcon(server.status)}
                        <Badge 
                          className={`text-xs ${getStatusColor(server.status)}`}
                        >
                          {server.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Server Type:</div>
                      <Badge variant="outline" className="text-xs">
                        {server.type}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Available Tools:</div>
                      <div className="flex flex-wrap gap-1">
                        {server.tools.slice(0, 3).map((tool, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                        {server.tools.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{server.tools.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Connected {server.lastConnected}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
