'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Bot,
  Search,
  Plus,
  MessageSquare,
  Settings,
  Play,
  MoreVertical,
  Star,
  Users,
  Clock,
  Zap,
  Shield,
  Globe,
  Code,
  Brain,
  Sparkles,
  TrendingUp,
  Filter,
  Grid3X3,
  List
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import axios from 'axios'

interface AIAgentsListPageProps {
  onBack: () => void
  onCreateAgent: () => void
}

interface AIAgent {
  id: string
  name: string
  handle: string
  description: string
  avatar?: string
  category: string
  tags: string[]
  status: 'active' | 'inactive' | 'training'
  model: string
  conversations: number
  rating: number
  createdAt: Date
  lastUsed?: Date
  tools: string[]
  isPublic: boolean
  isVerified: boolean
}

const mockAgents: AIAgent[] = [
  {
    id: '1',
    name: 'DeFi Assistant',
    handle: '@defi-assistant',
    description: 'Expert in decentralized finance, yield farming, and liquidity protocols. Helps users navigate the complex world of DeFi.',
    category: 'Finance',
    tags: ['DeFi', 'Yield Farming', 'Liquidity', 'AMM'],
    status: 'active',
    model: 'GPT-4',
    conversations: 1247,
    rating: 4.8,
    createdAt: new Date('2024-01-15'),
    lastUsed: new Date('2024-01-20'),
    tools: ['Web Search', 'Price Analysis', 'Portfolio Tracker'],
    isPublic: true,
    isVerified: true
  },
  {
    id: '2',
    name: 'Smart Contract Auditor',
    handle: '@audit-bot',
    description: 'Specialized in smart contract security analysis and vulnerability detection. Provides comprehensive audit reports.',
    category: 'Security',
    tags: ['Security', 'Audit', 'Solidity', 'Vulnerability'],
    status: 'active',
    model: 'Claude 3.5 Sonnet',
    conversations: 892,
    rating: 4.9,
    createdAt: new Date('2024-01-10'),
    lastUsed: new Date('2024-01-19'),
    tools: ['Code Analysis', 'Security Scanner', 'Gas Optimizer'],
    isPublic: true,
    isVerified: true
  },
  {
    id: '3',
    name: 'NFT Market Analyst',
    handle: '@nft-analyst',
    description: 'Tracks NFT market trends, floor prices, and collection analytics. Provides insights for NFT trading and investment.',
    category: 'Analytics',
    tags: ['NFT', 'Analytics', 'Trading', 'Market Trends'],
    status: 'active',
    model: 'GPT-4o Mini',
    conversations: 654,
    rating: 4.6,
    createdAt: new Date('2024-01-12'),
    lastUsed: new Date('2024-01-18'),
    tools: ['Market Data', 'Price Tracker', 'Collection Scanner'],
    isPublic: false,
    isVerified: false
  },
  {
    id: '4',
    name: 'Cross-Chain Bridge Guide',
    handle: '@bridge-guide',
    description: 'Helps users navigate cross-chain transactions and bridge assets between different blockchains safely.',
    category: 'Infrastructure',
    tags: ['Cross-Chain', 'Bridge', 'Multi-Chain', 'Interoperability'],
    status: 'training',
    model: 'GPT-4',
    conversations: 0,
    rating: 0,
    createdAt: new Date('2024-01-20'),
    tools: ['Bridge Scanner', 'Gas Calculator', 'Route Optimizer'],
    isPublic: true,
    isVerified: false
  },
  {
    id: '5',
    name: 'DAO Governance Expert',
    handle: '@dao-expert',
    description: 'Specialized in DAO governance, proposal analysis, and voting strategies. Helps communities make informed decisions.',
    category: 'Governance',
    tags: ['DAO', 'Governance', 'Voting', 'Proposals'],
    status: 'active',
    model: 'Claude 3.5 Sonnet',
    conversations: 423,
    rating: 4.7,
    createdAt: new Date('2024-01-08'),
    lastUsed: new Date('2024-01-17'),
    tools: ['Proposal Analyzer', 'Voting Tracker', 'Community Insights'],
    isPublic: true,
    isVerified: true
  }
]

const categories = ['All', 'Finance', 'Security', 'Analytics', 'Infrastructure', 'Governance', 'Trading', 'Development']

export default function AIAgentsListPage({ onBack, onCreateAgent }: AIAgentsListPageProps) {
  const { user, isAuthLoading } = useAuth()
  const [agents, setAgents] = useState<AIAgent[]>(mockAgents)
  const [filteredAgents, setFilteredAgents] = useState<AIAgent[]>(mockAgents)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent')

  // Filter and search logic
  useEffect(() => {
    let filtered = agents

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(agent => agent.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Sort agents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastUsed || b.createdAt).getTime() - new Date(a.lastUsed || a.createdAt).getTime()
        case 'popular':
          return b.conversations - a.conversations
        case 'rating':
          return b.rating - a.rating
        default:
          return 0
      }
    })

    setFilteredAgents(filtered)
  }, [agents, searchQuery, selectedCategory, sortBy])

  const handleAgentClick = (agent: AIAgent) => {
    // Navigate to agent details or start conversation
    console.log('Selected agent:', agent)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-gray-500'
      case 'training':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'training':
        return 'Training'
      default:
        return 'Unknown'
    }
  }

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>Loading AI Agents...</div>
        </div>
      </div>
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">AI Agents</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="gap-2">
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </Button>
            <Button onClick={onCreateAgent} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4" />
              Create Agent
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'rating')}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="h-8"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{filteredAgents.length}</p>
                    <p className="text-sm text-muted-foreground">Total Agents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{filteredAgents.filter(a => a.status === 'active').length}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {filteredAgents.reduce((sum, agent) => sum + agent.conversations, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Conversations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {filteredAgents.length > 0 
                        ? (filteredAgents.reduce((sum, agent) => sum + agent.rating, 0) / filteredAgents.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agents Grid/List */}
          {filteredAgents.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first AI agent to get started'
                }
              </p>
              <Button onClick={onCreateAgent} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Agent
              </Button>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredAgents.map((agent) => (
                <Card 
                  key={agent.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                  onClick={() => handleAgentClick(agent)}
                >
                  <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                          <Bot className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{agent.name}</CardTitle>
                            {agent.isVerified && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{agent.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                        <span className="text-xs text-muted-foreground">{getStatusText(agent.status)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className={viewMode === 'list' ? 'flex-1' : ''}>
                    <CardDescription className="mb-4 line-clamp-2">
                      {agent.description}
                    </CardDescription>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {agent.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {agent.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{agent.conversations.toLocaleString()} chats</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span>{agent.rating}/5.0</span>
                      </div>
                    </div>

                    {/* Tools */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Tools:</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.slice(0, 2).map((tool) => (
                          <Badge key={tool} variant="secondary" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                        {agent.tools.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{agent.tools.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-2">
                        <Play className="h-4 w-4" />
                        Start Chat
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
