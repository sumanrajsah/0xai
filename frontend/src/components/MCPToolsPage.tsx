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
          <div className="flex justify-center items-center mt-8">
            <Button 
              onClick={onAddMCP} 
              className="gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add MCP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}