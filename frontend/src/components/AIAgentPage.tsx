'use client'

import { useState } from 'react'
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
  Play
} from 'lucide-react'

interface AIAgentPageProps {
  onBack: () => void
  onAskInChat: () => void
}

export default function AIAgentPage({ onBack, onAskInChat }: AIAgentPageProps) {
  const [agentName, setAgentName] = useState('Aum Agent')
  const [agentHandle, setAgentHandle] = useState('@aumAgent')
  const [description, setDescription] = useState('')
  const [primaryModel, setPrimaryModel] = useState('GPT 4o Mini')
  const [instructions, setInstructions] = useState('Detailed instructions for your primary model')
  const [temperature, setTemperature] = useState('0.7')
  const [topP, setTopP] = useState('0.5')
  const [maxTokens, setMaxTokens] = useState('4000')
  const [selectedTools, setSelectedTools] = useState<string[]>([])

  const prebuiltTools = [
    {
      id: 'search',
      name: 'Web Search',
      description: 'Allows the AI to search the web and retrieve real-time information.',
      icon: Search
    }
  ]

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    )
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
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Create Agent
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
                  <Input 
                    value={agentHandle}
                    onChange={(e) => setAgentHandle(e.target.value)}
                    placeholder="@agentHandle"
                  />
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
                  onChange={(e) => setPrimaryModel(e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="GPT 4o Mini">GPT 4o Mini</option>
                  <option value="GPT-4">GPT-4</option>
                  <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Model Instructions: *</label>
                <Textarea 
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter detailed instructions for your primary model"
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Advanced Configuration - Primary Model:</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Temperature ({temperature}):</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Top P ({topP}):</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={topP}
                      onChange={(e) => setTopP(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Tokens:</label>
                    <Input 
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(e.target.value)}
                      type="number"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prebuilt Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Select Prebuilt Tools: {selectedTools.length}</CardTitle>
              <CardDescription>Choose tools to enhance your agent's capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prebuiltTools.map((tool) => {
                  const Icon = tool.icon
                  const isSelected = selectedTools.includes(tool.id)
                  return (
                    <Card 
                      key={tool.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleTool(tool.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
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
              
              <Separator className="my-6" />
              
              <div className="flex items-center justify-between">
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add MCP Tools
                </Button>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add MCP
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Conversation Starter */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Starter</CardTitle>
              <CardDescription>Add a starter message to help users begin conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="gap-2">
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
