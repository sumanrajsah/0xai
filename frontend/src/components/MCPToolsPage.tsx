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
import {
  ArrowLeft,
  Wrench,
  Plus,
} from "lucide-react";

interface MCPToolsPageProps {
  onBack: () => void;
  onAddMCP: () => void;
}

export default function MCPToolsPage({ onBack, onAddMCP }: MCPToolsPageProps) {
  const [mcpServers] = useState([
    {
      id: "1",
      name: "SitrAi",
      description: "AI-powered search and analysis tools",
      status: "connected",
      type: "Streamable HTTP",
      uri: "https://mcp.sitrai.com/mcp",
    },
    {
      id: "2",
      name: "WebSearch",
      description: "Real-time web search capabilities",
      status: "disconnected",
      type: "WebSocket",
      uri: "wss://mcp.websearch.com/ws",
    },
  ]);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">MCP Tools</h1>
            </div>
          </div>
          <Button onClick={onAddMCP} className="gap-2">
            <Plus className="h-4 w-4" />
            Add MCP
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Model Context Protocol Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Develop and manage MCP tools for seamless AI integration and
              enhanced capabilities. Connect to various services and extend your
              AI agent's functionality.
            </p>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common MCP operations and tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={onAddMCP}
                >
                  <Plus className="h-6 w-6" />
                  <span>Add MCP Server</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
