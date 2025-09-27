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
  Users,
  Tag,
  CheckCircle,
  Upload,
  X,
  Search,
  Filter,
  Grid3X3,
  List,
  Settings,
  Play,
  Star,
  MessageSquare,
  Shield,
  Clock,
  Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface MyAgentsPageProps {
  onBack: () => void
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

const mockUserAgents: AIAgent[] = [
  {
    id: '1',
    name: 'Personal DeFi Tracker',
    handle: '@my-defi-tracker',
    description: 'My personal DeFi portfolio tracker and yield farming assistant.',
    category: 'Finance',
    tags: ['DeFi', 'Portfolio'],
    status: 'active',
    model: 'GPT-4',
    conversations: 45,
    rating: 4.5,
    createdAt: new Date('2024-01-15'),
    lastUsed: new Date('2024-01-20'),
    tools: ['Portfolio Tracker', 'Price Alerts'],
    isPublic: false,
    isVerified: false
  },
  {
    id: '2',
    name: 'NFT Collection Manager',
    handle: '@my-nft-manager',
    description: 'Manages my NFT collection and tracks floor prices.',
    category: 'Analytics',
    tags: ['NFT', 'Collection'],
    status: 'active',
    model: 'GPT-4o Mini',
    conversations: 23,
    rating: 4.2,
    createdAt: new Date('2024-01-12'),
    lastUsed: new Date('2024-01-19'),
    tools: ['Collection Scanner', 'Price Tracker'],
    isPublic: false,
    isVerified: false
  },
  {
    id: '3',
    name: 'Smart Contract Helper',
    handle: '@my-contract-helper',
    description: 'Helps me understand and interact with smart contracts.',
    category: 'Development',
    tags: ['Smart Contracts', 'Solidity'],
    status: 'training',
    model: 'Claude 3.5 Sonnet',
    conversations: 0,
    rating: 0,
    createdAt: new Date('2024-01-20'),
    tools: ['Contract Analyzer', 'Gas Optimizer'],
    isPublic: false,
    isVerified: false
  }
]

const categories = ['Finance', 'Security', 'Analytics', 'Infrastructure', 'Governance', 'Trading', 'Development']

export default function MyAgentsPage({ onBack }: MyAgentsPageProps) {
  const { user, isAuthLoading } = useAuth()
  const [agents, setAgents] = useState<AIAgent[]>(mockUserAgents)
  const [filteredAgents, setFilteredAgents] = useState<AIAgent[]>(mockUserAgents)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent')
  
  // Publishing functionality
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPublishForm, setShowPublishForm] = useState(false)

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

  // Publishing functionality helpers
  const handleAddTag = () => {
    if (tagInput.trim() && selectedTags.length < 3 && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const handlePublish = async () => {
    if (!selectedAgent || selectedTags.length === 0 || selectedCategories.length === 0) {
      return
    }

    setIsPublishing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update agent with new tags and categories
      const updatedAgent = {
        ...selectedAgent,
        tags: [...selectedAgent.tags, ...selectedTags],
        category: selectedCategories[0], // Use first category as primary
        isPublic: true
      }
      
      setAgents(agents.map(agent => agent.id === selectedAgent.id ? updatedAgent : agent))
      
      // Reset form
      setSelectedAgent(null)
      setSelectedTags([])
      setSelectedCategories([])
      setShowPublishForm(false)
      
      console.log('Agent published successfully:', updatedAgent)
    } catch (error) {
      console.error('Failed to publish agent:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleAgentClick = (agent: AIAgent) => {
    // Navigate to agent details or start conversation
    console.log('Selected agent:', agent)
  }

  const handlePublishAgent = (agent: AIAgent) => {
    setSelectedAgent(agent)
    setShowPublishForm(true)
  }

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>Loading My Agents...</div>
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
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">My Agents</h1>
            </div>
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
                  placeholder="Search your agents..."
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
              <Button
                variant={selectedCategory === 'All' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory('All')}
                className="h-8"
              >
                All
              </Button>
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
                  : 'You haven\'t created any agents yet'
                }
              </p>
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
                        <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePublishAgent(agent)
                        }}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Publish
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

      {/* Publish Form Modal */}
      {showPublishForm && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 flex items-center justify-center">
                    <Upload className="h-3 w-3 text-white" />
                  </div>
                  <CardTitle>Publish Agent</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPublishForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Make your agent public and discoverable by the community
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Selected Agent Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedAgent.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAgent.handle}</p>
                  </div>
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Additional Tags (Max 3)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1"
                    disabled={selectedTags.length >= 3}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || selectedTags.length >= 3}
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryToggle(category)}
                      className="justify-start"
                    >
                      {selectedCategories.includes(category) && (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Publish Button */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPublishForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePublish}
                  disabled={selectedTags.length === 0 || selectedCategories.length === 0 || isPublishing}
                  className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Publish Agent
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
