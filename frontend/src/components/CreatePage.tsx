'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bot, Wrench, Sparkles, Users, Zap } from 'lucide-react'

interface CreatePageProps {
  onBack: () => void
  onSelectAIAgent: () => void
  onSelectMCPTools: () => void
}

export default function CreatePage({ onBack, onSelectAIAgent, onSelectMCPTools }: CreatePageProps) {
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Create</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">What would you like to Create?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Build powerful AI tools, prompts, and integrations that solve real problems. 
              Share your creations with the community and earn from your innovations.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* AI Agents Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20" onClick={onSelectAIAgent}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">AI Agents</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      Ready to build
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-base">
                  Build sophisticated AI agents that automate complex workflows and decision-making processes
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Community driven</span>
                  </div>
                  <Button className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Start Building
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* MCP Tools Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20" onClick={onSelectMCPTools}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">MCP Tools</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      Ready to build
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-base">
                  Develop Model Context Protocol tools for seamless AI integration and enhanced capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>High performance</span>
                  </div>
                  <Button className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Start Building
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8">Why Choose 0xAI?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">AI-Powered</h4>
                <p className="text-muted-foreground">Leverage cutting-edge AI technology for your projects</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Community</h4>
                <p className="text-muted-foreground">Share and collaborate with a vibrant developer community</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Fast & Reliable</h4>
                <p className="text-muted-foreground">Build and deploy with enterprise-grade infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
